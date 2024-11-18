/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDefaultReactNativeFactoryDelegate.h"
#import "RCTAppSetupUtils.h"


@implementation RCTDefaultReactNativeFactoryDelegate

- (NSURL * _Nullable)sourceURLForBridge:(nonnull RCTBridge *)bridge { 
  [NSException raise:@"RCTBridgeDelegate::sourceURLForBridge not implemented"
              format:@"Subclasses must implement a valid sourceURLForBridge method"];
  return nil;
}

- (UIViewController *)createRootViewController { 
  return [UIViewController new];
}

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions {
  return [[RCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController
{
  rootViewController.view = rootView;
}

- (void)customizeRootView:(RCTRootView *)rootView
{
  // Override point for customization after application launch.
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge moduleName:(NSString *)moduleName initProps:(NSDictionary *)initProps {
  BOOL enableFabric = self.fabricEnabled;
  UIView *rootView = RCTAppSetupDefaultRootView(bridge, moduleName, initProps, enableFabric);

  rootView.backgroundColor = [UIColor systemBackgroundColor];

  return rootView;
}


- (RCTColorSpace)defaultColorSpace { 
  return RCTColorSpaceSRGB;
}


- (NSURL * _Nullable)bundleURL {
  [NSException raise:@"RCTAppDelegate::bundleURL not implemented"
              format:@"Subclasses must implement a valid getBundleURL method"];
  return nullptr;
}

#pragma mark - RCTArchConfiguratorProtocol

- (BOOL)newArchEnabled {
#if RCT_NEW_ARCH_ENABLED
  return YES;
#else
  return NO;
#endif
}

- (BOOL)bridgelessEnabled { 
  return self.newArchEnabled;
}

- (BOOL)fabricEnabled { 
  return self.newArchEnabled;
}


- (BOOL)turboModuleEnabled { 
  return self.newArchEnabled;
}



@end
