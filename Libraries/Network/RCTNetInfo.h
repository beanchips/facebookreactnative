/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTNETINFO_H
#define RCTNETINFO_H

#import <SystemConfiguration/SystemConfiguration.h>

#import <React/RCTEventEmitter.h>

@interface RCTNetInfo : RCTEventEmitter

- (instancetype)initWithHost:(NSString *)host;

@end

#endif //RCTNETINFO_H
