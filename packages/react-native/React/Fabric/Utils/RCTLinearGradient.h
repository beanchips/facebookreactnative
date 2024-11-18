/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <react/renderer/components/view/ViewProps.h>

NS_ASSUME_NONNULL_BEGIN

using namespace facebook::react;

@interface RCTLinearGradient : NSObject

+ (CALayer *)gradientLayerWithSize:(CGSize)size gradient:(const LinearGradient&)gradient;

@end

NS_ASSUME_NONNULL_END