/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.io.File
import java.net.URI
import java.util.*
import org.gradle.api.Project
import org.gradle.api.artifacts.repositories.MavenArtifactRepository

internal object DependencyUtils {

  fun configureRepositories(project: Project, reactNativeDir: File, versionString: String) {
    with(project) {
      if (hasProperty("REACT_NATIVE_MAVEN_LOCAL_REPO")) {
        mavenRepoFromUrl("file://${property("REACT_NATIVE_MAVEN_LOCAL_REPO")}")
      }
      if(versionString.matches(Regex(".*\\d{4}"))) {
        println ("Here's the version string: $versionString")
        // if we are here, it means that we are local testing RN
        // which is shaped like "1000.0.0-20221027-1041"
        // the only way here is the local E2E script, so we can assume the path.
        mavenRepoFromUrl("file:///private/tmp/maven-local")
      }
      // We add the snapshot for users on nightlies.
      mavenRepoFromUrl("https://oss.sonatype.org/content/repositories/snapshots/")
      repositories.mavenCentral()
      // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
      mavenRepoFromUrl("file://${reactNativeDir}/android")
      // Android JSC is installed from npm
      mavenRepoFromUrl("file://${reactNativeDir}/../jsc-android/dist")
      repositories.google()
      mavenRepoFromUrl("https://www.jitpack.io")
    }
  }

  fun configureDependencies(project: Project, versionString: String) {
    if (versionString.isBlank()) return
    project.configurations.all { configuration ->
      configuration.resolutionStrategy.force(
          "com.facebook.react:react-native:${versionString}",
          "com.facebook.react:hermes-engine:${versionString}",
      )
    }
  }

  fun readVersionString(propertiesFile: File): String {
    val reactAndroidProperties = Properties()
    propertiesFile.inputStream().use { reactAndroidProperties.load(it) }
    return reactAndroidProperties["VERSION_NAME"] as? String ?: ""
  }

  fun Project.mavenRepoFromUrl(url: String): MavenArtifactRepository =
      project.repositories.maven { it.url = URI.create(url) }
}
