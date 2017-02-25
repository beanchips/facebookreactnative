const fs = require('fs-extra');
const path = require('path');
const xcode = require('xcode');
const log = require('npmlog');
const plistParser = require('plist');
const groupFilesByType = require('../groupFilesByType');
const createGroupWithMessage = require('./createGroupWithMessage');
const getPlist = require('./getPlist');
const getPlistPath = require('./getPlistPath');

/**
 * Creates XCode Group references and plist entries for custom fonts
 * and links video files in Resources.
 */
module.exports = function linkAssetsIOS(files, projectConfig) {
  const project = xcode.project(projectConfig.pbxprojPath).parseSync();
  const assets = groupFilesByType(files);
  const plist = getPlist(project, projectConfig.sourceDir);

  createGroupWithMessage(project, 'Resources');

  const addResourcesOfType = (type) => {
    return (assets[type] || [])
      .map(asset =>
        project.addResourceFile(
          path.relative(projectConfig.sourceDir, asset),
          { target: project.getFirstTarget().uuid }
        )
      )
      .filter(file => file)   // xcode returns false if file is already there
      .map(file => file.basename);
  };

  addResourcesOfType('video');
  const fonts = addResourcesOfType('font');

  const existingFonts = (plist.UIAppFonts || []);
  const allFonts = [...existingFonts, ...fonts];
  plist.UIAppFonts = Array.from(new Set(allFonts)); // use Set to dedupe w/existing

  fs.writeFileSync(
    projectConfig.pbxprojPath,
    project.writeSync()
  );

  fs.writeFileSync(
    getPlistPath(project, projectConfig.sourceDir),
    plistParser.build(plist)
  );
};
