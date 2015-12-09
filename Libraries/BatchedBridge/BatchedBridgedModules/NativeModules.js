/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NativeModules
 * @flow
 */
'use strict';

console.log("AAA");
var NativeModules = require('BatchedBridge').RemoteModules;
console.log("BBB");

var nativeModulePrefixNormalizer = require('nativeModulePrefixNormalizer');

nativeModulePrefixNormalizer(NativeModules);

module.exports = NativeModules;
