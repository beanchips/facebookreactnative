/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const entrypointTemplate = require('./entrypoint-template');
const {spawnSync} = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const {formatResultsErrors} = require('jest-message-util');
const Metro = require('metro');
const nullthrows = require('nullthrows');
const os = require('os');
const path = require('path');

const BUILD_OUTPUT_PATH = path.resolve(__dirname, '..', 'build');

function parseRNTesterCommandResult(commandArgs, result) {
  const stdout = result.stdout.toString();

  const outputArray = stdout.trim().split('\n');

  // Remove AppRegistry logs at the end
  while (
    outputArray.length > 0 &&
    outputArray[outputArray.length - 1].startsWith('Running "')
  ) {
    outputArray.pop();
  }

  // The last line should be the test output in JSON format
  const testResultJSON = outputArray.pop();

  let testResult;
  try {
    testResult = JSON.parse(nullthrows(testResultJSON));
  } catch (error) {
    throw new Error(
      [
        'Failed to parse test results from RN tester binary result. Full output:',
        'buck2 ' + commandArgs.join(' '),
        'stdout:',
        stdout,
        'stderr:',
        result.stderr.toString(),
      ].join('\n'),
    );
  }

  return {logs: outputArray.join('\n'), testResult};
}

function getBuckModeForPlatform() {
  switch (os.platform()) {
    case 'linux':
      return '@//arvr/mode/linux/dev';
    case 'darwin':
      return os.arch() === 'arm64'
        ? '@//arvr/mode/mac-arm/dev'
        : '@//arvr/mode/mac/dev';
    case 'win32':
      return '@//arvr/mode/win/dev';
    default:
      throw new Error(`Unsupported platform: ${os.platform()}`);
  }
}

function getShortHash(contents) {
  return crypto.createHash('md5').update(contents).digest('hex').slice(0, 8);
}

module.exports = async function runTest(
  globalConfig,
  config,
  environment,
  runtime,
  testPath,
  sendMessageToJest,
) {
  const startTime = Date.now();

  const metroConfig = await Metro.loadConfig({
    config: require.resolve('../config/metro.config.js'),
  });

  const setupModulePath = path.resolve(__dirname, '../runtime/setup.js');

  const entrypointContents = entrypointTemplate({
    testPath: `.${path.sep}${path.relative(BUILD_OUTPUT_PATH, testPath)}`,
    setupModulePath: `.${path.sep}${path.relative(BUILD_OUTPUT_PATH, setupModulePath)}`,
  });

  const entrypointPath = path.join(
    BUILD_OUTPUT_PATH,
    `${getShortHash(entrypointContents)}-${path.basename(testPath)}`,
  );
  const testBundlePath = entrypointPath + '.bundle';

  fs.mkdirSync(path.dirname(entrypointPath), {recursive: true});
  fs.writeFileSync(entrypointPath, entrypointContents, 'utf8');

  await Metro.runBuild(metroConfig, {
    entry: entrypointPath,
    out: testBundlePath,
    platform: 'android',
    minify: false,
    dev: true,
  });

  const rnTesterCommandArgs = [
    'run',
    getBuckModeForPlatform(),
    '//xplat/ReactNative/react-native-cxx/samples/tester:tester',
    '--',
    `--bundlePath=${testBundlePath}`,
  ];
  const rnTesterCommandResult = spawnSync('buck2', rnTesterCommandArgs, {
    encoding: 'utf8',
  });

  if (rnTesterCommandResult.status !== 0) {
    throw new Error(
      [
        'Failed to run test in RN tester binary. Full output:',
        'buck2 ' + rnTesterCommandArgs.join(' '),
        'stdout:',
        rnTesterCommandResult.stdout,
        'stderr:',
        rnTesterCommandResult.stderr,
      ].join('\n'),
    );
  }

  const rnTesterParsedOutput = parseRNTesterCommandResult(
    rnTesterCommandArgs,
    rnTesterCommandResult,
  );

  const testResultError = rnTesterParsedOutput.testResult.error;
  if (testResultError) {
    const error = new Error(testResultError.message);
    error.stack = testResultError.stack;
    throw error;
  }

  const endTime = Date.now();

  console.log(rnTesterParsedOutput.logs);

  const testResults =
    nullthrows(rnTesterParsedOutput.testResult.testResults).map(testResult => ({
      ancestorTitles: [],
      failureDetails: [],
      testFilePath: testPath,
      ...testResult,
    })) ?? [];

  return {
    testFilePath: testPath,
    failureMessage: formatResultsErrors(
      testResults,
      config,
      globalConfig,
      testPath,
    ),
    leaks: false,
    openHandles: [],
    perfStats: {
      start: startTime,
      end: endTime,
      duration: endTime - startTime,
      runtime: endTime - startTime,
      slow: false,
    },
    snapshot: {
      added: 0,
      fileDeleted: false,
      matched: 0,
      unchecked: 0,
      uncheckedKeys: [],
      unmatched: 0,
      updated: 0,
    },
    numTotalTests: testResults.length,
    numPassingTests: testResults.filter(test => test.status === 'passed')
      .length,
    numFailingTests: testResults.filter(test => test.status === 'failed')
      .length,
    numPendingTests: 0,
    numTodoTests: 0,
    skipped: false,
    testResults,
  };
};
