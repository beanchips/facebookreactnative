/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';
import type {ComponentShape} from '../../CodegenSchema';

const {
  getNativeTypeFromAnnotation,
  getLocalImports,
} = require('./ComponentsGeneratorUtils.js');

const {
  convertDefaultTypeToString,
  getEnumMaskName,
  generateStructName,
  toIntEnumValueName,
} = require('./CppHelpers.js');

const {getEnumName, toSafeCppString} = require('../Utils');

import type {
  ExtendsPropsShape,
  NamedShape,
  PropTypeAnnotation,
  SchemaType,
} from '../../CodegenSchema';

// File path -> contents
type FilesOutput = Map<string, string>;
type StructsMap = Map<string, string>;

const FileTemplate = ({
  imports,
  componentClasses,
}: {
  imports: string,
  componentClasses: string,
}) => `
/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GeneratePropsH.js
 */
#pragma once

${imports}

namespace facebook {
namespace react {

${componentClasses}

} // namespace react
} // namespace facebook
`;

const ClassTemplate = ({
  enums,
  structs,
  className,
  props,
  extendClasses,
}: {
  enums: string,
  structs: string,
  className: string,
  props: string,
  extendClasses: string,
}) =>
  `
${enums}
${structs}
class JSI_EXPORT ${className} final${extendClasses} {
 public:
  ${className}() = default;
  ${className}(const PropsParserContext& context, const ${className} &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  ${props}
};
`.trim();

const EnumTemplate = ({
  enumName,
  values,
  fromCases,
  toCases,
}: {
  enumName: string,
  values: string,
  fromCases: string,
  toCases: string,
}) =>
  `
enum class ${enumName} { ${values} };

static inline void fromRawValue(const PropsParserContext& context, const RawValue &value, ${enumName} &result) {
  auto string = (std::string)value;
  ${fromCases}
  abort();
}

static inline std::string toString(const ${enumName} &value) {
  switch (value) {
    ${toCases}
  }
}
`.trim();

const IntEnumTemplate = ({
  enumName,
  values,
  fromCases,
  toCases,
}: {
  enumName: string,
  values: string,
  fromCases: string,
  toCases: string,
}) =>
  `
enum class ${enumName} { ${values} };

static inline void fromRawValue(const PropsParserContext& context, const RawValue &value, ${enumName} &result) {
  assert(value.hasType<int>());
  auto integerValue = (int)value;
  switch (integerValue) {${fromCases}
  }
  abort();
}

static inline std::string toString(const ${enumName} &value) {
  switch (value) {
    ${toCases}
  }
}
`.trim();

const StructTemplate = ({
  structName,
  fields,
  fromCases,
}: {
  structName: string,
  fields: string,
  fromCases: string,
}) =>
  `struct ${structName} {
  ${fields}
};

static inline void fromRawValue(const PropsParserContext& context, const RawValue &value, ${structName} &result) {
  auto map = (butter::map<std::string, RawValue>)value;

  ${fromCases}
}

static inline std::string toString(const ${structName} &value) {
  return "[Object ${structName}]";
}
`.trim();

const ArrayConversionFunctionTemplate = ({
  structName,
}: {
  structName: string,
}) => `static inline void fromRawValue(const PropsParserContext& context, const RawValue &value, std::vector<${structName}> &result) {
  auto items = (std::vector<RawValue>)value;
  for (const auto &item : items) {
    ${structName} newItem;
    fromRawValue(context, item, newItem);
    result.emplace_back(newItem);
  }
}
`;

const DoubleArrayConversionFunctionTemplate = ({
  structName,
}: {
  structName: string,
}) => `static inline void fromRawValue(const PropsParserContext& context, const RawValue &value, std::vector<std::vector<${structName}>> &result) {
  auto items = (std::vector<std::vector<RawValue>>)value;
  for (const std::vector<RawValue> &item : items) {
    auto nestedArray = std::vector<${structName}>{};
    for (const RawValue &nestedItem : item) {
      ${structName} newItem;
      fromRawValue(context, nestedItem, newItem);
      nestedArray.emplace_back(newItem);
    }
    result.emplace_back(nestedArray);
  }
}
`;

const ArrayEnumTemplate = ({
  enumName,
  enumMask,
  values,
  fromCases,
  toCases,
}: {
  enumName: string,
  enumMask: string,
  values: string,
  fromCases: string,
  toCases: string,
}) =>
  `
using ${enumMask} = uint32_t;

enum class ${enumName}: ${enumMask} {
  ${values}
};

constexpr bool operator&(
  ${enumMask} const lhs,
  enum ${enumName} const rhs) {
  return lhs & static_cast<${enumMask}>(rhs);
}

constexpr ${enumMask} operator|(
  ${enumMask} const lhs,
  enum ${enumName} const rhs) {
  return lhs | static_cast<${enumMask}>(rhs);
}

constexpr void operator|=(
  ${enumMask} &lhs,
  enum ${enumName} const rhs) {
  lhs = lhs | static_cast<${enumMask}>(rhs);
}

static inline void fromRawValue(const PropsParserContext& context, const RawValue &value, ${enumMask} &result) {
  auto items = std::vector<std::string>{value};
  for (const auto &item : items) {
    ${fromCases}
    abort();
  }
}

static inline std::string toString(const ${enumMask} &value) {
    auto result = std::string{};
    auto separator = std::string{", "};

    ${toCases}
    if (!result.empty()) {
      result.erase(result.length() - separator.length());
    }
    return result;
}
`.trim();

function getClassExtendString(component: ComponentShape): string {
  if (component.extendsProps.length === 0) {
    throw new Error('Invalid: component.extendsProps is empty');
  }
  const extendString =
    ' : ' +
    component.extendsProps
      .map(extendProps => {
        switch (extendProps.type) {
          case 'ReactNativeBuiltInType':
            switch (extendProps.knownTypeName) {
              case 'ReactNativeCoreViewProps':
                return 'public ViewProps';
              default:
                (extendProps.knownTypeName: empty);
                throw new Error('Invalid knownTypeName');
            }
          default:
            (extendProps.type: empty);
            throw new Error('Invalid extended type');
        }
      })
      .join(' ');

  return extendString;
}

function convertValueToEnumOption(value: string): string {
  return toSafeCppString(value);
}

function generateArrayEnumString(
  componentName: string,
  name: string,
  options: $ReadOnlyArray<string>,
): string {
  const enumName = getEnumName(componentName, name);

  const values = options
    .map((option, index) => `${toSafeCppString(option)} = 1 << ${index}`)
    .join(',\n  ');

  const fromCases = options
    .map(
      option =>
        `if (item == "${option}") {
      result |= ${enumName}::${toSafeCppString(option)};
      continue;
    }`,
    )
    .join('\n    ');

  const toCases = options
    .map(
      option =>
        `if (value & ${enumName}::${toSafeCppString(option)}) {
      result += "${option}" + separator;
    }`,
    )
    .join('\n' + '    ');

  return ArrayEnumTemplate({
    enumName,
    enumMask: getEnumMaskName(enumName),
    values,
    fromCases,
    toCases,
  });
}

function generateStringEnum(
  componentName: string,
  prop: NamedShape<PropTypeAnnotation>,
) {
  const typeAnnotation = prop.typeAnnotation;
  if (typeAnnotation.type === 'StringEnumTypeAnnotation') {
    const values: $ReadOnlyArray<string> = typeAnnotation.options;
    const enumName = getEnumName(componentName, prop.name);

    const fromCases = values
      .map(
        value =>
          `if (string == "${value}") { result = ${enumName}::${convertValueToEnumOption(
            value,
          )}; return; }`,
      )
      .join('\n' + '  ');

    const toCases = values
      .map(
        value =>
          `case ${enumName}::${convertValueToEnumOption(
            value,
          )}: return "${value}";`,
      )
      .join('\n' + '    ');

    return EnumTemplate({
      enumName,
      values: values.map(toSafeCppString).join(', '),
      fromCases: fromCases,
      toCases: toCases,
    });
  }

  return '';
}

function generateIntEnum(
  componentName: string,
  prop: NamedShape<PropTypeAnnotation>,
) {
  const typeAnnotation = prop.typeAnnotation;
  if (typeAnnotation.type === 'Int32EnumTypeAnnotation') {
    const values: $ReadOnlyArray<number> = typeAnnotation.options;
    const enumName = getEnumName(componentName, prop.name);

    const fromCases = values
      .map(
        value =>
          `
    case ${value}:
      result = ${enumName}::${toIntEnumValueName(prop.name, value)};
      return;`,
      )
      .join('');

    const toCases = values
      .map(
        value =>
          `case ${enumName}::${toIntEnumValueName(
            prop.name,
            value,
          )}: return "${value}";`,
      )
      .join('\n' + '    ');

    const valueVariables = values
      .map(val => `${toIntEnumValueName(prop.name, val)} = ${val}`)
      .join(', ');

    return IntEnumTemplate({
      enumName,
      values: valueVariables,
      fromCases,
      toCases,
    });
  }

  return '';
}

function generateEnumString(
  componentName: string,
  component: ComponentShape,
): string {
  return component.props
    .map(prop => {
      if (
        prop.typeAnnotation.type === 'ArrayTypeAnnotation' &&
        prop.typeAnnotation.elementType.type === 'StringEnumTypeAnnotation'
      ) {
        return generateArrayEnumString(
          componentName,
          prop.name,
          prop.typeAnnotation.elementType.options,
        );
      }

      if (prop.typeAnnotation.type === 'StringEnumTypeAnnotation') {
        return generateStringEnum(componentName, prop);
      }

      if (prop.typeAnnotation.type === 'Int32EnumTypeAnnotation') {
        return generateIntEnum(componentName, prop);
      }

      if (prop.typeAnnotation.type === 'ObjectTypeAnnotation') {
        return prop.typeAnnotation.properties
          .map(property => {
            if (property.typeAnnotation.type === 'StringEnumTypeAnnotation') {
              return generateStringEnum(componentName, property);
            } else if (
              property.typeAnnotation.type === 'Int32EnumTypeAnnotation'
            ) {
              return generateIntEnum(componentName, property);
            }
            return null;
          })
          .filter(Boolean)
          .join('\n');
      }
    })
    .filter(Boolean)
    .join('\n');
}

function generatePropsString(
  componentName: string,
  props: $ReadOnlyArray<NamedShape<PropTypeAnnotation>>,
) {
  return props
    .map(prop => {
      const nativeType = getNativeTypeFromAnnotation(componentName, prop, []);
      const defaultValue = convertDefaultTypeToString(componentName, prop);

      return `${nativeType} ${prop.name}{${defaultValue}};`;
    })
    .join('\n' + '  ');
}

function getExtendsImports(
  extendsProps: $ReadOnlyArray<ExtendsPropsShape>,
): Set<string> {
  const imports: Set<string> = new Set();

  imports.add('#include <react/renderer/core/PropsParserContext.h>');
  imports.add('#include <jsi/jsi.h>');

  extendsProps.forEach(extendProps => {
    switch (extendProps.type) {
      case 'ReactNativeBuiltInType':
        switch (extendProps.knownTypeName) {
          case 'ReactNativeCoreViewProps':
            imports.add(
              '#include <react/renderer/components/view/ViewProps.h>',
            );
            return;
          default:
            (extendProps.knownTypeName: empty);
            throw new Error('Invalid knownTypeName');
        }
      default:
        (extendProps.type: empty);
        throw new Error('Invalid extended type');
    }
  });

  return imports;
}

function generateStructsForComponent(
  componentName: string,
  component: ComponentShape,
): string {
  const structs = generateStructs(componentName, component.props, []);
  const structArray = Array.from(structs.values());
  if (structArray.length < 1) {
    return '';
  }
  return structArray.join('\n\n');
}

function generateStructs(
  componentName: string,
  properties: $ReadOnlyArray<NamedShape<PropTypeAnnotation>>,
  nameParts: Array<string>,
): StructsMap {
  const structs: StructsMap = new Map();
  properties.forEach(prop => {
    const typeAnnotation = prop.typeAnnotation;
    if (typeAnnotation.type === 'ObjectTypeAnnotation') {
      // Recursively visit all of the object properties.
      // Note: this is depth first so that the nested structs are ordered first.
      const elementProperties = typeAnnotation.properties;
      const nestedStructs = generateStructs(
        componentName,
        elementProperties,
        nameParts.concat([prop.name]),
      );
      nestedStructs.forEach(function (value, key) {
        structs.set(key, value);
      });

      generateStruct(
        structs,
        componentName,
        nameParts.concat([prop.name]),
        typeAnnotation.properties,
      );
    }

    if (
      prop.typeAnnotation.type === 'ArrayTypeAnnotation' &&
      prop.typeAnnotation.elementType.type === 'ObjectTypeAnnotation'
    ) {
      // Recursively visit all of the object properties.
      // Note: this is depth first so that the nested structs are ordered first.
      const elementProperties = prop.typeAnnotation.elementType.properties;
      const nestedStructs = generateStructs(
        componentName,
        elementProperties,
        nameParts.concat([prop.name]),
      );
      nestedStructs.forEach(function (value, key) {
        structs.set(key, value);
      });

      // Generate this struct and its conversion function.
      generateStruct(
        structs,
        componentName,
        nameParts.concat([prop.name]),
        elementProperties,
      );

      // Generate the conversion function for std:vector<Object>.
      // Note: This needs to be at the end since it references the struct above.
      structs.set(
        `${[componentName, ...nameParts.concat([prop.name])].join(
          '',
        )}ArrayStruct`,
        ArrayConversionFunctionTemplate({
          structName: generateStructName(
            componentName,
            nameParts.concat([prop.name]),
          ),
        }),
      );
    }
    if (
      prop.typeAnnotation.type === 'ArrayTypeAnnotation' &&
      prop.typeAnnotation.elementType.type === 'ArrayTypeAnnotation' &&
      prop.typeAnnotation.elementType.elementType.type ===
        'ObjectTypeAnnotation'
    ) {
      // Recursively visit all of the object properties.
      // Note: this is depth first so that the nested structs are ordered first.
      const elementProperties =
        prop.typeAnnotation.elementType.elementType.properties;
      const nestedStructs = generateStructs(
        componentName,
        elementProperties,
        nameParts.concat([prop.name]),
      );
      nestedStructs.forEach(function (value, key) {
        structs.set(key, value);
      });

      // Generate this struct and its conversion function.
      generateStruct(
        structs,
        componentName,
        nameParts.concat([prop.name]),
        elementProperties,
      );

      // Generate the conversion function for std:vector<Object>.
      // Note: This needs to be at the end since it references the struct above.
      structs.set(
        `${[componentName, ...nameParts.concat([prop.name])].join(
          '',
        )}ArrayArrayStruct`,
        DoubleArrayConversionFunctionTemplate({
          structName: generateStructName(
            componentName,
            nameParts.concat([prop.name]),
          ),
        }),
      );
    }
  });

  return structs;
}

function generateStruct(
  structs: StructsMap,
  componentName: string,
  nameParts: $ReadOnlyArray<string>,
  properties: $ReadOnlyArray<NamedShape<PropTypeAnnotation>>,
): void {
  const structNameParts = nameParts;
  const structName = generateStructName(componentName, structNameParts);

  const fields = properties
    .map(property => {
      return `${getNativeTypeFromAnnotation(
        componentName,
        property,
        structNameParts,
      )} ${property.name};`;
    })
    .join('\n' + '  ');

  properties.forEach((property: NamedShape<PropTypeAnnotation>) => {
    const name = property.name;
    switch (property.typeAnnotation.type) {
      case 'BooleanTypeAnnotation':
        return;
      case 'StringTypeAnnotation':
        return;
      case 'Int32TypeAnnotation':
        return;
      case 'DoubleTypeAnnotation':
        return;
      case 'FloatTypeAnnotation':
        return;
      case 'ReservedPropTypeAnnotation':
        return;
      case 'ArrayTypeAnnotation':
        return;
      case 'StringEnumTypeAnnotation':
        return;
      case 'Int32EnumTypeAnnotation':
        return;
      case 'ObjectTypeAnnotation':
        const props = property.typeAnnotation.properties;
        if (props == null) {
          throw new Error(
            `Properties are expected for ObjectTypeAnnotation (see ${name} in ${componentName})`,
          );
        }
        generateStruct(structs, componentName, nameParts.concat([name]), props);
        return;
      default:
        (property.typeAnnotation.type: empty);
        throw new Error(
          `Received invalid component property type ${property.typeAnnotation.type}`,
        );
    }
  });

  const fromCases = properties
    .map(property => {
      const variable = 'tmp_' + property.name;
      return `auto ${variable} = map.find("${property.name}");
  if (${variable} != map.end()) {
    fromRawValue(context, ${variable}->second, result.${property.name});
  }`;
    })
    .join('\n  ');

  structs.set(
    structName,
    StructTemplate({
      structName,
      fields,
      fromCases,
    }),
  );
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
  ): FilesOutput {
    const fileName = 'Props.h';

    const allImports: Set<string> = new Set();

    const componentClasses = Object.keys(schema.modules)
      .map(moduleName => {
        const module = schema.modules[moduleName];
        if (module.type !== 'Component') {
          return;
        }

        const {components} = module;
        // No components in this module
        if (components == null) {
          return null;
        }

        return Object.keys(components)
          .map(componentName => {
            const component = components[componentName];

            const newName = `${componentName}Props`;
            const structString = generateStructsForComponent(
              componentName,
              component,
            );
            const enumString = generateEnumString(componentName, component);
            const propsString = generatePropsString(
              componentName,
              component.props,
            );
            const extendString = getClassExtendString(component);
            const extendsImports = getExtendsImports(component.extendsProps);
            const imports = getLocalImports(component.props);

            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            extendsImports.forEach(allImports.add, allImports);
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            imports.forEach(allImports.add, allImports);

            const replacedTemplate = ClassTemplate({
              enums: enumString,
              structs: structString,
              className: newName,
              extendClasses: extendString,
              props: propsString,
            });

            return replacedTemplate;
          })
          .join('\n\n');
      })
      .filter(Boolean)
      .join('\n\n');

    const replacedTemplate = FileTemplate({
      componentClasses,
      imports: Array.from(allImports).sort().join('\n'),
    });

    return new Map([[fileName, replacedTemplate]]);
  },
};
