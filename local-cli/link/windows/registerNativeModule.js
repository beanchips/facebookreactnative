const applyPatch = require('./patches/applyPatch');
// const makeStringsPatch = require('./patches/makeStringsPatch');
// const makeSettingsPatch = require('./patches/makeSettingsPatch');
// const makeBuildPatch = require('./patches/makeBuildPatch');
// const makeImportPatch = require('./patches/makeImportPatch');
// const makePackagePatch = require('./patches/makePackagePatch');

module.exports = function registerNativeWindowsModule(
  name,
  windowsConfig,
  params,
  projectConfig
) {
  // const buildPatch = makeBuildPatch(name);

  // applyPatch(
  //   projectConfig.settingsGradlePath,
  //   makeSettingsPatch(name, androidConfig, projectConfig)
  // );

  // applyPatch(projectConfig.buildGradlePath, buildPatch);
  // applyPatch(projectConfig.stringsPath, makeStringsPatch(params, name));

  // applyPatch(
  //   projectConfig.mainFilePath,
  //   makePackagePatch(androidConfig.packageInstance, params, name)
  // );

  // applyPatch(
  //   projectConfig.mainFilePath,
  //   makeImportPatch(androidConfig.packageImportPath)
  // );
};
