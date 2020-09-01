/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

const Promise = require('promise/setimmediate/es6-extensions');

require('promise/setimmediate/done');
require('promise/setimmediate/finally');

if (__DEV__) {
  require('promise/setimmediate/rejection-tracking').enable({
    allRejections: true,
    onUnhandled: (id, rejection = {}) => {
      let message: string;
      let stack: ?string;

      const stringValue = Object.prototype.toString.call(rejection);
      if (stringValue === '[object Error]') {
        message = Error.prototype.toString.call(rejection);
        const error: Error = (rejection: $FlowFixMe);
        stack = error.stack;
      } else {
        try {
          message = require('pretty-format')(rejection);
        } catch {
          message =
            typeof rejection === 'string'
              ? rejection
              : JSON.stringify((rejection: $FlowFixMe));
        }
      }

      const warning =
        `Possible Unhandled Promise Rejection (id: ${id}):\n` +
        `${message ?? ''}\n` +
        (stack == null ? '' : stack);
      console.warn(warning);
    },
    onHandled: id => {
      const warning =
        `Promise Rejection Handled (id: ${id})\n` +
        'This means you can ignore any previous messages of the form ' +
        `"Possible Unhandled Promise Rejection (id: ${id}):"`;
      console.warn(warning);
    },
  });
}

module.exports = Promise;
