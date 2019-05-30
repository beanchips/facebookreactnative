/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../../TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +reload: () => void;
  +setHotLoadingEnabled: (isHotLoadingEnabled: boolean) => void;
  +setIsDebuggingRemotely: (isDebugginRemotelyEnabled: boolean) => void;
  +setLiveReloadEnabled: (isLiveReloadEnabled: boolean) => void;
  +setProfilingEnabled: (isProfilingEnabled: boolean) => void;
  +toggleElementInspector: () => void;
  +setIsShakeToShowDevMenuEnabled?: (enabled: boolean) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DevSettings');
