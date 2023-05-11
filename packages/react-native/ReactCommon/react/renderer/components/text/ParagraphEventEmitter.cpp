/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphEventEmitter.h"

namespace facebook::react {

static jsi::Value linesMeasurementsPayload(
    jsi::Runtime &runtime,
    LinesMeasurements const &linesMeasurements,
    RegionsMeasurements const &regionsMeasurements) {
  auto payload = jsi::Object(runtime);
  auto lines = jsi::Array(runtime, linesMeasurements.size());
  auto regions = jsi::Array(runtime, regionsMeasurements.size());

  for (size_t i = 0; i < linesMeasurements.size(); ++i) {
    auto const &lineMeasurement = linesMeasurements[i];
    auto jsiLine = jsi::Object(runtime);
    jsiLine.setProperty(runtime, "text", lineMeasurement.text);
    jsiLine.setProperty(runtime, "x", lineMeasurement.frame.origin.x);
    jsiLine.setProperty(runtime, "y", lineMeasurement.frame.origin.y);
    jsiLine.setProperty(runtime, "width", lineMeasurement.frame.size.width);
    jsiLine.setProperty(runtime, "height", lineMeasurement.frame.size.height);
    jsiLine.setProperty(runtime, "descender", lineMeasurement.descender);
    jsiLine.setProperty(runtime, "capHeight", lineMeasurement.capHeight);
    jsiLine.setProperty(runtime, "ascender", lineMeasurement.ascender);
    jsiLine.setProperty(runtime, "xHeight", lineMeasurement.xHeight);
    lines.setValueAtIndex(runtime, i, jsiLine);
  }
  
  if (regionsMeasurements.size() == 2) {
    regions.setValueAtIndex(runtime, 0, regionsMeasurements[0]);
    regions.setValueAtIndex(runtime, 1, regionsMeasurements[1]);
  }

  payload.setProperty(runtime, "lines", lines);
  payload.setProperty(runtime, "regions", regions);

  return payload;
}

void ParagraphEventEmitter::onTextLayout(
    LinesMeasurements const &linesMeasurements,
    RegionsMeasurements const &regionsMeasurements) const {
  {
    std::lock_guard<std::mutex> guard(linesMeasurementsMutex_);
    if (linesMeasurementsMetrics_ == linesMeasurements) {
      return;
    }
    linesMeasurementsMetrics_ = linesMeasurements;
    regionsMeasurementsMetrics_ = regionsMeasurements;
  }

  dispatchEvent("textLayout", [linesMeasurements, regionsMeasurements](jsi::Runtime &runtime) {
    return linesMeasurementsPayload(runtime, linesMeasurements, regionsMeasurements);
  });
}

} // namespace facebook::react
