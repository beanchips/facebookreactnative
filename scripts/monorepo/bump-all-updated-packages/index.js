/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const {REPO_ROOT} = require('../../consts');
const {getPackageVersionStrByTag} = require('../../npm-utils');
const {
  isReleaseBranch,
  parseVersion,
} = require('../../releases/utils/version-utils');
const {getBranchName} = require('../../scm-utils');
const {getPackages} = require('../../utils/monorepo');
const alignPackageVersions = require('../align-package-versions');
const checkForGitChanges = require('../check-for-git-changes');
const {
  COMMIT_WITH_CUSTOM_MESSAGE_CHOICE,
  COMMIT_WITH_GENERIC_MESSAGE_CHOICE,
  GENERIC_COMMIT_MESSAGE,
  NO_COMMIT_CHOICE,
  PUBLISH_PACKAGES_TAG,
} = require('../constants');
const bumpPackageVersion = require('./bump-package-version');
const detectPackageUnreleasedChanges = require('./bump-utils');
const chalk = require('chalk');
const {execSync} = require('child_process');
const inquirer = require('inquirer');
const path = require('path');
const {echo, exec, exit} = require('shelljs');

const buildExecutor =
  (
    packageAbsolutePath /*: string */,
    packageRelativePathFromRoot /*: string */,
    packageManifest /*: $FlowFixMe */,
  ) =>
  async () => {
    const {name: packageName} = packageManifest;
    if (packageManifest.private) {
      echo(`\u23ED Skipping private package ${chalk.dim(packageName)}`);

      return;
    }

    if (
      !detectPackageUnreleasedChanges(
        packageRelativePathFromRoot,
        packageName,
        REPO_ROOT,
      )
    ) {
      return;
    }

    await inquirer
      .prompt([
        {
          type: 'list',
          name: 'shouldBumpPackage',
          message: `Do you want to bump ${packageName}?`,
          choices: ['Yes', 'No'],
          filter: val => val === 'Yes',
        },
      ])
      .then(({shouldBumpPackage}) => {
        if (!shouldBumpPackage) {
          echo(`Skipping bump for ${packageName}`);
          return;
        }

        return inquirer
          .prompt([
            {
              type: 'list',
              name: 'increment',
              message: 'Which version you want to increment?',
              choices: ['patch', 'minor'],
            },
          ])
          .then(({increment}) => {
            const updatedVersion = bumpPackageVersion(
              packageAbsolutePath,
              packageManifest,
              increment,
            );
            echo(
              `\u2705 Successfully bumped ${chalk.green(
                packageName,
              )} to ${chalk.green(updatedVersion)}`,
            );
          });
      });
  };

const main = async () => {
  if (checkForGitChanges()) {
    echo(
      chalk.red(
        'Found uncommitted changes. Please commit or stash them before running this script',
      ),
    );
    exit(1);
  }

  const packages = await getPackages({
    includeReactNative: false,
    includePrivate: true,
  });

  for (const pkg of Object.values(packages)) {
    const executor = buildExecutor(
      pkg.path,
      path.relative(REPO_ROOT, pkg.path),
      pkg.packageJson,
    );

    await executor()
      .catch(() => exit(1))
      .then(() => echo());
  }

  if (!checkForGitChanges()) {
    echo('No changes have been made. Finishing the process...');
    exit(0);
  }

  echo('Aligning new versions across monorepo...');
  await alignPackageVersions();
  echo(chalk.green('Done!\n'));

  // Figure out the npm dist-tags we want for all monorepo packages we're bumping
  const branchName = getBranchName();
  const choices = [];

  if (branchName === 'main') {
    choices.push({name: '"nightly"', value: 'nightly', checked: true});
  } else if (isReleaseBranch(branchName)) {
    choices.push({
      name: `"${branchName}"`,
      value: branchName,
      checked: true,
    });

    const latestVersion = getPackageVersionStrByTag('react-native', 'latest');
    const {major, minor} = parseVersion(latestVersion, 'release');
    choices.push({
      name: '"latest"',
      value: 'latest',
      checked: `${major}.${minor}-stable` === branchName,
    });
  } else {
    echo(
      'You should be running `yarn bump-all-updated-packages` only from release or main branch',
    );
    exit(1);
  }

  const {tags} = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'tags',
      message: 'Select suggested npm tags.',
      choices,
      required: true,
    },
  ]);

  const {confirm} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: `Confirm these tags for *ALL* packages being bumped: ${tags
      .map(t => `"${t}"`)
      .join()}`,
  });

  if (!confirm) {
    echo('Exiting without commiting...');
    exit(0);
  }

  const tagString = '&' + tags.join('&');

  await inquirer
    .prompt([
      {
        type: 'list',
        name: 'commitChoice',
        message: 'Do you want to submit a commit with these changes?',
        choices: [
          {
            name: 'Yes, with generic message',
            value: COMMIT_WITH_GENERIC_MESSAGE_CHOICE,
          },
          {
            name: 'Yes, with custom message',
            value: COMMIT_WITH_CUSTOM_MESSAGE_CHOICE,
          },
          {
            name: 'No',
            value: NO_COMMIT_CHOICE,
          },
        ],
      },
    ])
    .then(({commitChoice}) => {
      switch (commitChoice) {
        case NO_COMMIT_CHOICE: {
          echo('Not submitting a commit, but keeping all changes');

          break;
        }

        case COMMIT_WITH_GENERIC_MESSAGE_CHOICE: {
          exec(`git commit -am "${GENERIC_COMMIT_MESSAGE}${tagString}"`, {
            cwd: REPO_ROOT,
            silent: true,
          });

          break;
        }

        case COMMIT_WITH_CUSTOM_MESSAGE_CHOICE: {
          // exec from shelljs currently does not support interactive input
          // https://github.com/shelljs/shelljs/wiki/FAQ#running-interactive-programs-with-exec
          execSync('git commit -a', {cwd: REPO_ROOT, stdio: 'inherit'});

          const enteredCommitMessage = exec('git log -n 1 --format=format:%B', {
            cwd: REPO_ROOT,
            silent: true,
          }).stdout.trim();
          const commitMessageWithTag =
            enteredCommitMessage + `\n\n${PUBLISH_PACKAGES_TAG}${tagString}`;

          exec(`git commit --amend -m "${commitMessageWithTag}"`, {
            cwd: REPO_ROOT,
            silent: true,
          });

          break;
        }

        default:
          throw new Error('');
      }
    })
    .then(() => echo());

  echo(chalk.green('Successfully finished the process of bumping packages'));
  exit(0);
};

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
