/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

import type {SchemaType} from '../../../src/CodegenSchema';
import type {GeneratorParameters} from '../../../src/generators/Utils';

const generator = require('../../../src/generators/modules/GenerateModuleH');
const {FlowParser} = require('../../../src/parsers/flow/parser');
const fs = require('fs');

const FIXTURE_DIR = `${__dirname}/../../__test_fixtures__/modules`;

const parser = new FlowParser();

function getModules(): SchemaType {
  const filenames: Array<string> = fs.readdirSync(FIXTURE_DIR);
  return filenames.reduce<SchemaType>(
    (accumulator, file) => {
      const schema = parser.parseFile(`${FIXTURE_DIR}/${file}`);
      return {
        modules: {
          ...accumulator.modules,
          ...schema.modules,
        },
      };
    },
    {modules: {}},
  );
}

describe('GenerateModuleH', () => {
  it('can generate a header file NativeModule specs', () => {
    const libName = 'RNCodegenModuleFixtures';
    const params: GeneratorParameters = {
      libraryName: libName,
      schema: getModules(),
    };
    const output = generator.generate(params);
    expect(output.get(libName + 'JSI.h')).toMatchSnapshot();
  });

  it('can generate a header file NativeModule specs with assume nonnull enabled', () => {
    const libName = 'RNCodegenModuleFixtures';
    const params: GeneratorParameters = {
      libraryName: libName,
      schema: getModules(),
    };
    const output = generator.generate(params);
    expect(output.get(libName + 'JSI.h')).toMatchSnapshot();
  });
});
