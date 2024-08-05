/*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

#include "PerformanceObserver.h"
#include "PerformanceObserverRegistry.h"
#include "PerformanceEntryReporter.h"

namespace facebook::react {

PerformanceObserver::~PerformanceObserver() {
  if (auto registry = registry_.lock()) {
    registry->removeObserver(*this);
  }
}

void PerformanceObserver::pushEntry(const facebook::react::PerformanceEntry& entry) {
  entries_.push_back(entry);
}

std::vector<PerformanceEntry> PerformanceObserver::takeRecords() {
  auto copy = entries_;
  entries_.clear();
  return copy;
}

bool PerformanceObserver::isObserving(facebook::react::PerformanceEntryType type) const {
  return observedTypes_.contains(type);
}

void PerformanceObserver::observe(facebook::react::PerformanceEntryType type, bool buffered) {
  // we assume that `type` was checked on JS side and is correct
  observedTypes_.clear();
  observedTypes_.insert(type);

  requiresDroppedEntries_ = true;

  if (buffered) {
    auto& reporter = PerformanceEntryReporter::getInstance();
    reporter->getBuffer(type).getEntries(std::nullopt, entries_);
    scheduleFlushBuffer();
  }
}

void PerformanceObserver::observe(std::unordered_set<PerformanceEntryType> types) {
  observedTypes_ = types;
  requiresDroppedEntries_ = true;
}

void PerformanceObserver::scheduleFlushBuffer() {
  if (!callback_) {
    return;
  }

  auto droppedEntriesCount = 0;

  if (requiresDroppedEntries_) {
    auto reporter = PerformanceEntryReporter::getInstance();

    for (auto& entry : observedTypes_) {
      droppedEntriesCount += reporter->getBuffer(entry).droppedEntriesCount;
    }

    requiresDroppedEntries_ = false;
  }

  callback_(takeRecords(), droppedEntriesCount);
}

} // namespace facebook::react
