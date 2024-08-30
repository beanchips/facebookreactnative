/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeDelegate.h>
#import <React/RCTConvert.h>
#import <UIKit/UIKit.h>
#import "RCTRootViewFactory.h"

@class RCTBridge;
@protocol RCTBridgeDelegate;
@protocol RCTComponentViewProtocol;
@class RCTRootView;
@class RCTSurfacePresenterBridgeAdapter;

NS_ASSUME_NONNULL_BEGIN

@protocol ReactNativeFactoryDelegate <RCTBridgeDelegate>

/// Return the bundle URL for the main bundle.
- (NSURL *__nullable)bundleURL;

@optional
/**
 * It creates a `RCTBridge` using a delegate and some launch options.
 * By default, it is invoked passing `self` as a delegate.
 * You can override this function to customize the logic that creates the RCTBridge
 *
 * @parameter: delegate - an object that implements the `RCTBridgeDelegate` protocol.
 * @parameter: launchOptions - a dictionary with a set of options.
 *
 * @returns: a newly created instance of RCTBridge.
 */
- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions;

/**
 * It creates a `UIView` starting from a bridge, a module name and a set of initial properties.
 * By default, it is invoked using the bridge created by `createBridgeWithDelegate:launchOptions` and
 * the name in the `self.moduleName` variable.
 * You can override this function to customize the logic that creates the Root View.
 *
 * @parameter: bridge - an instance of the `RCTBridge` object.
 * @parameter: moduleName - the name of the app, used by Metro to resolve the module.
 * @parameter: initProps - a set of initial properties.
 *
 * @returns: a UIView properly configured with a bridge for React Native.
 */
- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps;
/**
 * This method can be used to customize the rootView that is passed to React Native.
 * A typical example is to override this method in the AppDelegate to change the background color.
 * To achieve this, add in your `AppDelegate.mm`:
 * ```
 * - (void)customizeRootView:(RCTRootView *)rootView
 * {
 *   rootView.backgroundColor = [UIColor colorWithDynamicProvider:^UIColor *(UITraitCollection *traitCollection) {
 *     if ([traitCollection userInterfaceStyle] == UIUserInterfaceStyleDark) {
 *       return [UIColor blackColor];
 *     } else {
 *       return [UIColor whiteColor];
 *     }
 *   }];
 * }
 * ```
 *
 * @parameter: rootView - The root view to customize.
 */
- (void)customizeRootView:(RCTRootView *)rootView;

/**
 * The default `RCTColorSpace` for the app. It defaults to `RCTColorSpaceSRGB`.
 */
@property (nonatomic, readonly) RCTColorSpace defaultColorSpace;

/// This method returns a map of Component Descriptors and Components classes that needs to be registered in the
/// new renderer. The Component Descriptor is a string which represent the name used in JS to refer to the native
/// component. The default implementation returns an empty dictionary. Subclasses can override this method to register
/// the required components.
///
/// @return a dictionary that associate a component for the new renderer with his descriptor.
- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents;

/// This method controls whether the `turboModules` feature of the New Architecture is turned on or off.
///
/// @note: This is required to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the Turbo Native Module are enabled. Otherwise, it returns `false`.
- (BOOL)turboModuleEnabled __attribute__((deprecated("Use newArchEnabled instead")));

/// This method controls whether the App will use the Fabric renderer of the New Architecture or not.
///
/// @return: `true` if the Fabric Renderer is enabled. Otherwise, it returns `false`.
- (BOOL)fabricEnabled __attribute__((deprecated("Use newArchEnabled instead")));

/// This method controls whether React Native's new initialization layer is enabled.
///
/// @return: `true` if the new initialization layer is enabled. Otherwise returns `false`.
- (BOOL)bridgelessEnabled __attribute__((deprecated("Use newArchEnabled instead")));

/// This method controls whether React Native uses new Architecture.
///
/// @return: `true` if the new architecture is enabled. Otherwise returns `false`.
- (BOOL)newArchEnabled;

@end


@interface RCTReactNativeFactory : NSObject

- (instancetype)initWithDelegate:(id<ReactNativeFactoryDelegate>)delegate;

@property (nonatomic, nullable) RCTBridge *bridge;
@property (nonatomic, strong, nullable) NSString *moduleName;
@property (nonatomic, strong, nullable) NSDictionary *initialProps;
@property (nonatomic, strong, nonnull) RCTRootViewFactory *rootViewFactory;

@property (nonatomic, nullable) RCTSurfacePresenterBridgeAdapter *bridgeAdapter;

@property (nonatomic, weak) id<ReactNativeFactoryDelegate> delegate;

@end

NS_ASSUME_NONNULL_END
