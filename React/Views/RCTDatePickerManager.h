/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTDATEPICKERMANAGER_H
#define RCTDATEPICKERMANAGER_H

#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>

@interface RCTConvert(UIDatePicker)

+ (UIDatePickerMode)UIDatePickerMode:(id)json;

@end

@interface RCTDatePickerManager : RCTViewManager

@end

#endif //RCTDATEPICKERMANAGER_H
