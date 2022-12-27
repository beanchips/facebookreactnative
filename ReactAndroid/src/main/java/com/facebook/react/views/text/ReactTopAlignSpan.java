/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import android.graphics.Rect;
import android.text.TextPaint;
import android.text.style.SuperscriptSpan;

/** ratio 0 for center ratio 0.4 for top ratio */
public class ReactTopAlignSpan extends SuperscriptSpan implements ReactSpan {
  @Override
  public void updateDrawState(TextPaint ds) {
    Rect bounds = new Rect();
    ds.getTextBounds("1A", 0, 2, bounds);
    ds.baselineShift -= bounds.top - ds.getFontMetrics().ascent;
  }

  @Override
  public void updateMeasureState(TextPaint tp) {
    updateDrawState(tp);
  }
}
