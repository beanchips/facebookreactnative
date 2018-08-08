/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import javax.annotation.Nullable;

import android.view.View;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Dynamic;

/**
 * Wrapper for {@link ReadableMap} which should be used for styles property map. It extends
 * some of the accessor methods of {@link ReadableMap} by adding a default value property
 * such that caller is enforced to provide a default value for a style property.
 *
 * Instances of this class are used to update {@link View} or {@link CSSNode} style properties.
 * Since properties are generated by React framework based on what has been updated each value
 * in this map should either be interpreted as a new value set for a style property or as a "reset
 * this property to default" command in case when value is null (this is a way React communicates
 * change in which the style key that was previously present in a map has been removed).
 *
 * NOTE: Accessor method with default value will throw an exception when the key is not present in
 * the map. Style applicator logic should verify whether the key exists in the map using
 * {@link #hasKey} before fetching the value. The motivation behind this is that in case when the
 * updated style diff map doesn't contain a certain style key it means that the corresponding view
 * property shouldn't be updated (whereas in all other cases it should be updated to the new value
 * or the property should be reset).
 */
public class ReactStylesDiffMap {

  /* package */ final ReadableMap mBackingMap;

  public ReactStylesDiffMap(ReadableMap props) {
    mBackingMap = props;
  }

  public boolean hasKey(String name) {
    return mBackingMap.hasKey(name);
  }

  public boolean isNull(String name) {
    return mBackingMap.isNull(name);
  }

  public boolean getBoolean(String name, boolean restoreNullToDefaultValue) {
    return mBackingMap.isNull(name) ? restoreNullToDefaultValue : mBackingMap.getBoolean(name);
  }

  public double getDouble(String name, double restoreNullToDefaultValue) {
    return mBackingMap.isNull(name) ? restoreNullToDefaultValue : mBackingMap.getDouble(name);
  }

  public float getFloat(String name, float restoreNullToDefaultValue) {
    return mBackingMap.isNull(name) ?
        restoreNullToDefaultValue : (float) mBackingMap.getDouble(name);
  }

  public int getInt(String name, int restoreNullToDefaultValue) {
    return mBackingMap.isNull(name) ? restoreNullToDefaultValue : mBackingMap.getInt(name);
  }

  @Nullable
  public String getString(String name) {
    return mBackingMap.getString(name);
  }

  @Nullable
  public ReadableArray getArray(String key) {
    return mBackingMap.getArray(key);
  }

  @Nullable
  public ReadableMap getMap(String key) {
    return mBackingMap.getMap(key);
  }

  @Nullable
  public Dynamic getDynamic(String key) {
    return mBackingMap.getDynamic(key);
  }

  @Override
  public String toString() {
    return "{ " + getClass().getSimpleName() + ": " + mBackingMap.toString() + " }";
  }
}
