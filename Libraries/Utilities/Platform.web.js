/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Platform = {
  OS: 'web',
  select: (obj: Object) => ('web' in obj ? obj.web : obj.default),
};

module.exports = Platform;
