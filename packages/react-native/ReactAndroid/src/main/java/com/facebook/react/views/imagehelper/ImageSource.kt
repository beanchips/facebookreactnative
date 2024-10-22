/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.imagehelper

import android.content.Context
import android.net.Uri
import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants
import com.facebook.react.views.image.ImageCacheControl
import java.util.Objects
import android.util.Log

/** Class describing an image source (network URI or resource) and size. */
public open class ImageSource
@JvmOverloads
constructor(
    context: Context,
    /** Get the source of this image, as it was passed to the constructor. */
    public val source: String?,
    width: Double = 0.0,
    height: Double = 0.0,
    cacheControl: String? = null
) {

  init {
    // Log cache control to ensure it's set correctly
    Log.d("ImageSource", "CacheControl set to: $cacheControl")
  }

  /** Get the URI for this image - can be either a parsed network URI or a resource URI. */
  public open val uri: Uri = computeUri(context)
  /** Get the area of this image. */
  public val size: Double = width * height
  /** Get whether this image source represents an Android resource or a network URI. */
  public open val isResource: Boolean
    get() = _isResource

  public val cacheControl: ImageCacheControl = computeCacheControl(cacheControl)

  private var _isResource: Boolean = false

  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }

    if (other == null || javaClass != other.javaClass) {
      return false
    }

    val that = other as ImageSource
    return java.lang.Double.compare(that.size, size) == 0 &&
        isResource == that.isResource &&
        uri == that.uri &&
        source == that.source
  }

  override fun hashCode(): Int = Objects.hash(uri, source, size, isResource)

  private fun computeUri(context: Context): Uri =
      try {
        val uri = Uri.parse(source)
        // Verify scheme is set, so that relative uri (used by static resources) are not handled.
        if (uri.scheme == null) computeLocalUri(context) else uri
      } catch (e: NullPointerException) {
        computeLocalUri(context)
      }

  private fun computeLocalUri(context: Context): Uri {
    _isResource = true
    return ResourceDrawableIdHelper.instance.getResourceDrawableUri(context, source)
  }

  private fun computeCacheControl(cacheControl: String?): ImageCacheControl {
    return when (cacheControl) {
      null,
      "default" -> ImageCacheControl.DEFAULT
      "reload" -> ImageCacheControl.RELOAD
      else -> {
        FLog.w(ReactConstants.TAG, "Invalid resize method $cacheControl")
        return ImageCacheControl.DEFAULT
      }
    }
  }

  public companion object {
    private const val TRANSPARENT_BITMAP_URI =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

    @JvmStatic
    public fun getTransparentBitmapImageSource(context: Context): ImageSource =
        ImageSource(context, TRANSPARENT_BITMAP_URI)
  }
}
