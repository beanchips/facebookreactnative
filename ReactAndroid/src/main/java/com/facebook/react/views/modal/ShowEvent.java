/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

/** {@link Event} for showing a Dialog. */
/* package */ class ShowEvent extends Event<ShowEvent> {

  public static final String EVENT_NAME = "topShow";

  @Deprecated
  protected ShowEvent(int viewTag) {
    this(-1, viewTag);
  }

  protected ShowEvent(int surfaceId, int viewTag) {
    super(surfaceId, viewTag);
  }

  @Override
  public String getEventName() {
    return EVENT_NAME;
  }

  @Nullable
  @Override
  protected WritableMap getEventData() {
    return Arguments.createMap();
  }
}
