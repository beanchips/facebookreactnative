/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {NativeMethods} from '../Renderer/shims/ReactNativeTypes';

type PublicInstance = {
  ...NativeMethods,
};

export type InstanceFromReactDevTools =
  | PublicInstance
  | {
      canonical?:
        | PublicInstance // TODO: remove this variant when syncing the new version of the renderer from React to React Native.
        | {
            publicInstance?: PublicInstance,
          },
    };

export type ReactDevToolsAgentEvents = {
  drawTraceUpdates: [Array<{node: InstanceFromReactDevTools, color: string}>],
  disableTraceUpdates: [],
};

export type ReactDevToolsAgent = {
  selectNode(node: mixed): void,
  addListener<Event: $Keys<ReactDevToolsAgentEvents>>(
    event: Event,
    listener: (...ReactDevToolsAgentEvents[Event]) => void,
  ): void,
  removeListener(
    event: $Keys<ReactDevToolsAgentEvents>,
    listener: () => void,
  ): void,
};

export type ReactDevToolsGlobalHook = {
  on: (eventName: string, (agent: ReactDevToolsAgent) => void) => void,
  off: (eventName: string, (agent: ReactDevToolsAgent) => void) => void,
  reactDevtoolsAgent?: ReactDevToolsAgent,
};
