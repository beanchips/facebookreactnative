/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @generated by enums.py
// clang-format off
#pragma once

#include <cstdint>
#include <yoga/YGEnums.h>
#include <yoga/enums/YogaEnums.h>

namespace facebook::yoga {

enum class NodeType : uint8_t {
  Default = YGNodeTypeDefault,
  Text = YGNodeTypeText,
};

template <>
constexpr int32_t ordinalCount<NodeType>() {
  return 2;
}

constexpr NodeType scopedEnum(YGNodeType unscoped) {
  return static_cast<NodeType>(unscoped);
}

constexpr YGNodeType unscopedEnum(NodeType scoped) {
  return static_cast<YGNodeType>(scoped);
}

inline const char* toString(NodeType e) {
  return YGNodeTypeToString(unscopedEnum(e));
}

} // namespace facebook::yoga
