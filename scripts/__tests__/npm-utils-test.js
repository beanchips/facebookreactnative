/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {getPackageVersionStrByTag, publishPackage} = require('../npm-utils');

const execMock = jest.fn();
jest.mock('shelljs', () => ({
  exec: execMock,
}));

describe('npm-utils', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('getPackageVersionStrByTag', () => {
    it('should return package version string', () => {
      execMock.mockImplementationOnce(() => ({code: 0, stdout: '0.34.2 \n'}));
      const versionStr = getPackageVersionStrByTag('my-package', 'next');
      expect(versionStr).toBe('0.34.2');
    });
    it('should throw error when invalid result', () => {
      execMock.mockImplementationOnce(() => ({
        code: 1,
        stderr: 'Some error message',
      }));

      expect(() => {
        getPackageVersionStrByTag('my-package', 'next');
      }).toThrow('Failed to get next version from npm\nSome error message');
    });
  });

  describe('publishPackage', () => {
    it('should run publish command', () => {
      publishPackage(
        'path/to/my-package',
        {tag: 'latest', otp: 'otp'},
        {silent: true, cwd: 'i/expect/this/to/be/overriden'},
      );
      expect(execMock).toHaveBeenCalledWith(
        'npm publish --tag latest --otp otp',
        {silent: true, cwd: 'path/to/my-package'},
      );
    });

    it('should run publish command when no execOptions', () => {
      publishPackage('path/to/my-package', {tag: 'latest', otp: 'otp'});
      expect(execMock).toHaveBeenCalledWith(
        'npm publish --tag latest --otp otp',
        {cwd: 'path/to/my-package'},
      );
    });
  });
});
