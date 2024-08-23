/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>
#include <react/renderer/textlayoutmanager/TextMeasureCache.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

class TextLayoutManager;

/*
 * Cross platform facade for iOS-specific RCTTTextLayoutManager.
 */
class TextLayoutManager {
 public:
  TextLayoutManager(const ContextContainer::Shared& contextContainer);

  /*
   * Measures `attributedString` using native text rendering infrastructure.
   */
  TextMeasurement measure(
      const AttributedStringBox& attributedStringBox,
      const ParagraphAttributes& paragraphAttributes,
      const TextLayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const;

  /*
   * Measures lines of `attributedString` using native text rendering
   * infrastructure.
   */
  LinesMeasurements measureLines(
      const AttributedStringBox& attributedStringBox,
      const ParagraphAttributes& paragraphAttributes,
      const Size& size) const;

  /*
   * Calculates baseline of `attributedString` using native text rendering
   * infrastructure.
   */
  Float baseline(
      const AttributedStringBox& attributedStringBox,
      const ParagraphAttributes& paragraphAttributes,
      const Size& size) const;

  /*
   * Returns an opaque pointer to platform-specific TextLayoutManager.
   * Is used on a native views layer to delegate text rendering to the manager.
   */
  std::shared_ptr<void> getNativeTextLayoutManager() const;

 private:
  std::shared_ptr<void> self_;
  TextMeasureCache textMeasureCache_{};
  LineMeasureCache lineMeasureCache_{};
};

} // namespace facebook::react
