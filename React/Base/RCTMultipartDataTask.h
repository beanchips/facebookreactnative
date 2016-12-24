/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTMULTIPARTDATATASK_H
#define RCTMULTIPARTDATATASK_H

#import <Foundation/Foundation.h>

#import <React/RCTMultipartStreamReader.h>

typedef void (^RCTMultipartDataTaskCallback)(NSInteger statusCode, NSDictionary *headers, NSData *content, NSError *error, BOOL done);

@interface RCTMultipartDataTask : NSObject

- (instancetype)initWithURL:(NSURL *)url partHandler:(RCTMultipartDataTaskCallback)partHandler;
- (void)startTask;

@end

#endif //RCTMULTIPARTDATATASK_H
