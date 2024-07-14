/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<84bc0f2c1750310a2062ba947df45104>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

#include "ReactNativeFeatureFlags.h"

namespace facebook::react {

bool ReactNativeFeatureFlags::commonTestFlag() {
  return getAccessor().commonTestFlag();
}

bool ReactNativeFeatureFlags::allowCollapsableChildren() {
  return getAccessor().allowCollapsableChildren();
}

bool ReactNativeFeatureFlags::allowRecursiveCommitsWithSynchronousMountOnAndroid() {
  return getAccessor().allowRecursiveCommitsWithSynchronousMountOnAndroid();
}

bool ReactNativeFeatureFlags::batchRenderingUpdatesInEventLoop() {
  return getAccessor().batchRenderingUpdatesInEventLoop();
}

bool ReactNativeFeatureFlags::destroyFabricSurfacesInReactInstanceManager() {
  return getAccessor().destroyFabricSurfacesInReactInstanceManager();
}

bool ReactNativeFeatureFlags::enableAlignItemsBaselineOnFabricIOS() {
  return getAccessor().enableAlignItemsBaselineOnFabricIOS();
}

bool ReactNativeFeatureFlags::enableCleanTextInputYogaNode() {
  return getAccessor().enableCleanTextInputYogaNode();
}

bool ReactNativeFeatureFlags::enableGranularShadowTreeStateReconciliation() {
  return getAccessor().enableGranularShadowTreeStateReconciliation();
}

bool ReactNativeFeatureFlags::enableMicrotasks() {
  return getAccessor().enableMicrotasks();
}

bool ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid() {
  return getAccessor().enablePropsUpdateReconciliationAndroid();
}

bool ReactNativeFeatureFlags::enableSynchronousStateUpdates() {
  return getAccessor().enableSynchronousStateUpdates();
}

bool ReactNativeFeatureFlags::enableUIConsistency() {
  return getAccessor().enableUIConsistency();
}

bool ReactNativeFeatureFlags::fetchImagesInViewPreallocation() {
  return getAccessor().fetchImagesInViewPreallocation();
}

bool ReactNativeFeatureFlags::fixIncorrectScrollViewStateUpdateOnAndroid() {
  return getAccessor().fixIncorrectScrollViewStateUpdateOnAndroid();
}

bool ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact() {
  return getAccessor().fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool ReactNativeFeatureFlags::fixMissedFabricStateUpdatesOnAndroid() {
  return getAccessor().fixMissedFabricStateUpdatesOnAndroid();
}

bool ReactNativeFeatureFlags::forceBatchingMountItemsOnAndroid() {
  return getAccessor().forceBatchingMountItemsOnAndroid();
}

bool ReactNativeFeatureFlags::fuseboxEnabledDebug() {
  return getAccessor().fuseboxEnabledDebug();
}

bool ReactNativeFeatureFlags::fuseboxEnabledRelease() {
  return getAccessor().fuseboxEnabledRelease();
}

bool ReactNativeFeatureFlags::initEagerTurboModulesOnNativeModulesQueueAndroid() {
  return getAccessor().initEagerTurboModulesOnNativeModulesQueueAndroid();
}

bool ReactNativeFeatureFlags::lazyAnimationCallbacks() {
  return getAccessor().lazyAnimationCallbacks();
}

bool ReactNativeFeatureFlags::loadVectorDrawablesOnImages() {
  return getAccessor().loadVectorDrawablesOnImages();
}

bool ReactNativeFeatureFlags::setAndroidLayoutDirection() {
  return getAccessor().setAndroidLayoutDirection();
}

bool ReactNativeFeatureFlags::useImmediateExecutorInAndroidBridgeless() {
  return getAccessor().useImmediateExecutorInAndroidBridgeless();
}

bool ReactNativeFeatureFlags::useModernRuntimeScheduler() {
  return getAccessor().useModernRuntimeScheduler();
}

bool ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode() {
  return getAccessor().useNativeViewConfigsInBridgelessMode();
}

bool ReactNativeFeatureFlags::useNewReactImageViewBackgroundDrawing() {
  return getAccessor().useNewReactImageViewBackgroundDrawing();
}

bool ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdate() {
  return getAccessor().useRuntimeShadowNodeReferenceUpdate();
}

bool ReactNativeFeatureFlags::useRuntimeShadowNodeReferenceUpdateOnLayout() {
  return getAccessor().useRuntimeShadowNodeReferenceUpdateOnLayout();
}

bool ReactNativeFeatureFlags::useStateAlignmentMechanism() {
  return getAccessor().useStateAlignmentMechanism();
}

void ReactNativeFeatureFlags::override(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  getAccessor().override(std::move(provider));
}

void ReactNativeFeatureFlags::dangerouslyReset() {
  getAccessor(true);
}

ReactNativeFeatureFlagsAccessor& ReactNativeFeatureFlags::getAccessor(
    bool reset) {
  static std::unique_ptr<ReactNativeFeatureFlagsAccessor> accessor;
  if (accessor == nullptr || reset) {
    accessor = std::make_unique<ReactNativeFeatureFlagsAccessor>();
  }
  return *accessor;
}

} // namespace facebook::react
