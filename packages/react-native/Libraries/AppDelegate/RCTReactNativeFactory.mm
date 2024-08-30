/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTReactNativeFactory.h"
#import <React/RCTColorSpaceUtils.h>
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTHost.h>
#import <objc/runtime.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#import <react/renderer/graphics/ColorComponents.h>
#import "RCTAppDelegate+Protected.h"
#import "RCTAppSetupUtils.h"

#if RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTTurboModulePlugin/RCTTurboModulePlugin.h>
#else
#import <React/CoreModulesPlugins.h>
#endif
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewProtocol.h>
#if USE_HERMES
#import <ReactCommon/RCTHermesInstance.h>
#else
#import <ReactCommon/RCTJscInstance.h>
#endif
#import <react/nativemodule/defaults/DefaultTurboModules.h>

@interface RCTReactNativeFactory () <RCTComponentViewFactoryComponentProvider, RCTHostDelegate>
@end

@implementation RCTReactNativeFactory

- (instancetype)initWithDelegate:(id<ReactNativeFactoryDelegate>)delegate {
  if (self = [super init]) {
    self.delegate = delegate;
    
    RCTSetNewArchEnabled([self newArchEnabled]);
    [RCTColorSpaceUtils applyDefaultColorSpace:[self defaultColorSpace]];
    RCTEnableTurboModule([self turboModuleEnabled]);
    
    self.rootViewFactory = [self createRCTRootViewFactory];
    
    if ([self newArchEnabled] || [self fabricEnabled]) {
      [RCTComponentViewFactory currentComponentViewFactory].thirdPartyFabricComponentsProvider = self;
    }
  }
  
  return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return facebook::react::DefaultTurboModules::getTurboModule(name, jsInvoker);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  if ([_delegate respondsToSelector:@selector(createBridgeWithDelegate:launchOptions:)]) {
    return [_delegate createBridgeWithDelegate:delegate launchOptions:launchOptions];
  }
  
  return [[RCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  if ([_delegate respondsToSelector:@selector(createRootViewWithBridge:moduleName:initProps:)]) {
    return [_delegate createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  }
  
  BOOL enableFabric = self.delegate.fabricEnabled;
  UIView *rootView = RCTAppSetupDefaultRootView(bridge, moduleName, initProps, enableFabric);

  rootView.backgroundColor = [UIColor systemBackgroundColor];

  return rootView;
}

- (RCTColorSpace)defaultColorSpace
{
  if ([_delegate respondsToSelector:@selector(defaultColorSpace)]) {
    return [_delegate defaultColorSpace];
  }
  
  return RCTColorSpaceSRGB;
}


- (BOOL)newArchEnabled {
  if ([_delegate respondsToSelector:@selector(newArchEnabled)]) {
    return _delegate.newArchEnabled;
  }
#if RCT_NEW_ARCH_ENABLED
  return YES;
#else
  return NO;
#endif
}

- (BOOL)fabricEnabled {
  if ([_delegate respondsToSelector:@selector(fabricEnabled)]) {
    return _delegate.fabricEnabled;
  }
  
  return [self newArchEnabled];
}

- (BOOL)turboModuleEnabled {
  if ([_delegate respondsToSelector:@selector(turboModuleEnabled)]) {
    return _delegate.turboModuleEnabled;
  }
  
  return [self newArchEnabled];
}

- (BOOL)bridgelessEnabled {
  if ([_delegate respondsToSelector:@selector(bridgelessEnabled)]) {
    return _delegate.bridgelessEnabled;
  }
  
  return [self newArchEnabled];
}

#pragma mark - RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
#if RN_DISABLE_OSS_PLUGIN_HEADER
  return RCTTurboModulePluginClassProvider(name);
#else
  return RCTCoreModulesClassProvider(name);
#endif
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass);
}

#pragma mark - RCTComponentViewFactoryComponentProvider

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents
{
  return @{};
}

#pragma mark - RCTHostDelegate

- (void)hostDidStart:(RCTHost *)host
{
}

- (void)host:(RCTHost *)host
    didReceiveJSErrorStack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                   message:(NSString *)message
               exceptionId:(NSUInteger)exceptionId
                   isFatal:(BOOL)isFatal
{
}

- (RCTRootViewFactory *)createRCTRootViewFactory
{
  __weak __typeof(self) weakSelf = self;
  RCTBundleURLBlock bundleUrlBlock = ^{
    RCTReactNativeFactory *strongSelf = weakSelf;
    return strongSelf.delegate.bundleURL;
  };

  RCTRootViewFactoryConfiguration *configuration =
      [[RCTRootViewFactoryConfiguration alloc] initWithBundleURLBlock:bundleUrlBlock
                                                       newArchEnabled:self.fabricEnabled
                                                   turboModuleEnabled:self.turboModuleEnabled
                                                    bridgelessEnabled:self.bridgelessEnabled];

  configuration.createRootViewWithBridge = ^UIView *(RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps) {
    return [weakSelf createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  };

  configuration.createBridgeWithDelegate = ^RCTBridge *(id<RCTBridgeDelegate> delegate, NSDictionary *launchOptions) {
    return [weakSelf createBridgeWithDelegate:delegate launchOptions:launchOptions];
  };

//  configuration.customizeRootView = ^(UIView *_Nonnull rootView) {
//    [weakSelf customizeRootView:(RCTRootView *)rootView];
//  };

  configuration.sourceURLForBridge = ^NSURL *_Nullable(RCTBridge *_Nonnull bridge)
  {
    return [weakSelf.delegate sourceURLForBridge:bridge];
  };

  configuration.hostDidStartBlock = ^(RCTHost *_Nonnull host) {
    [weakSelf hostDidStart:host];
  };

  configuration.hostDidReceiveJSErrorStackBlock =
      ^(RCTHost *_Nonnull host,
        NSArray<NSDictionary<NSString *, id> *> *_Nonnull stack,
        NSString *_Nonnull message,
        NSUInteger exceptionId,
        BOOL isFatal) {
        [weakSelf host:host didReceiveJSErrorStack:stack message:message exceptionId:exceptionId isFatal:isFatal];
      };

  if ([self respondsToSelector:@selector(extraModulesForBridge:)]) {
    configuration.extraModulesForBridge = ^NSArray<id<RCTBridgeModule>> *_Nonnull(RCTBridge *_Nonnull bridge)
    {
      return [weakSelf.delegate extraModulesForBridge:bridge];
    };
  }

  if ([self respondsToSelector:@selector(extraLazyModuleClassesForBridge:)]) {
    configuration.extraLazyModuleClassesForBridge =
        ^NSDictionary<NSString *, Class> *_Nonnull(RCTBridge *_Nonnull bridge)
    {
      return [weakSelf.delegate extraLazyModuleClassesForBridge:bridge];
    };
  }

  if ([self respondsToSelector:@selector(bridge:didNotFindModule:)]) {
    configuration.bridgeDidNotFindModule = ^BOOL(RCTBridge *_Nonnull bridge, NSString *_Nonnull moduleName) {
      return [weakSelf.delegate bridge:bridge didNotFindModule:moduleName];
    };
  }

  return [[RCTRootViewFactory alloc] initWithConfiguration:configuration andTurboModuleManagerDelegate:self];
}

#pragma mark - Feature Flags

class RCTAppDelegateBridgelessFeatureFlags : public facebook::react::ReactNativeFeatureFlagsDefaults {
 public:
  bool useModernRuntimeScheduler() override
  {
    return true;
  }
  bool enableMicrotasks() override
  {
    return true;
  }
  bool batchRenderingUpdatesInEventLoop() override
  {
    return true;
  }
};

- (void)_setUpFeatureFlags
{
  if ([self.delegate bridgelessEnabled]) {
    facebook::react::ReactNativeFeatureFlags::override(std::make_unique<RCTAppDelegateBridgelessFeatureFlags>());
  }
}

@end
