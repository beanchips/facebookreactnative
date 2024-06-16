/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

import type {ReactTestRenderer} from 'react-test-renderer';

import nullthrows from 'nullthrows';
import * as React from 'react';
import TestRenderer from 'react-test-renderer';

export const create = async (
  Component: React.Element<any>,
): Promise<ReactTestRenderer> => {
  let component;
  await TestRenderer.act(async () => {
    component = TestRenderer.create(Component);
  });
  return nullthrows(component);
};
