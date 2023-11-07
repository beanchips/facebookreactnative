# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

# package.json
package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_CFG_NO_COROUTINES=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -Wno-comma -Wno-shorten-64-to-32'
folly_version = '2023.08.07.00'
boost_compiler_flags = '-Wno-documentation'

Pod::Spec.new do |s|
  s.name                   = "React-hermes"
  s.version                = version
  s.summary                = "Hermes engine for React Native"
  s.homepage               = "https://reactnative.dev/"
  s.license                = package['license']
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source
  s.source_files           = "executor/*.{cpp,h}",
                             "inspector-modern/chrome/*.{cpp,h}",
  s.public_header_files    = "executor/HermesExecutorFactory.h"
  s.compiler_flags         = folly_compiler_flags + ' ' + boost_compiler_flags
  s.pod_target_xcconfig    = {
                               "HEADER_SEARCH_PATHS" => "\"${PODS_ROOT}/hermes-engine/destroot/include\" \"$(PODS_TARGET_SRCROOT)/..\" \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/RCT-Folly\" \"$(PODS_ROOT)/DoubleConversion\" \"$(PODS_ROOT)/fmt/include\" \"$(PODS_ROOT)/libevent/include\"",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++20"
                             }
  s.header_dir             = "reacthermes"
  s.dependency "React-cxxreact", version
  s.dependency "React-jsiexecutor", version
  s.dependency "React-jsinspector", version
  s.dependency "React-perflogger", version
  s.dependency "RCT-Folly", folly_version
  s.dependency "DoubleConversion"
  s.dependency "fmt", "9.1.0"
  s.dependency "glog"
  s.dependency "hermes-engine"
  s.dependency "React-jsi"
end
