/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTTOUCHHANDLER_H
#define RCTTOUCHHANDLER_H

#import <UIKit/UIKit.h>

#import <React/RCTFrameUpdate.h>

@class RCTBridge;

@interface RCTTouchHandler : UIGestureRecognizer

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;
- (void)cancel;

@end

#endif //RCTTOUCHHANDLER_H
