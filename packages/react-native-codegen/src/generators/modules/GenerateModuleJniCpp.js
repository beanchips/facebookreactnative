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

import type {
  NamedShape,
  NativeModuleEventEmitterShape,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModulePropertyShape,
  NativeModuleReturnTypeAnnotation,
  Nullable,
  SchemaType,
} from '../../CodegenSchema';
import type {AliasResolver} from './Utils';

const {unwrapNullable} = require('../../parsers/parsers-commons');
const {createAliasResolver, getModules} = require('./Utils');

type FilesOutput = Map<string, string>;

type JSReturnType =
  | 'VoidKind'
  | 'StringKind'
  | 'BooleanKind'
  | 'NumberKind'
  | 'PromiseKind'
  | 'ObjectKind'
  | 'ArrayKind';

const HostFunctionTemplate = ({
  hasteModuleName,
  propertyName,
  jniSignature,
  jsReturnType,
}: $ReadOnly<{
  hasteModuleName: string,
  propertyName: string,
  jniSignature: string,
  jsReturnType: JSReturnType,
}>) => {
  return `static facebook::jsi::Value __hostFunction_${hasteModuleName}SpecJSI_${propertyName}(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  static jmethodID cachedMethodId = nullptr;
  return static_cast<JavaTurboModule &>(turboModule).invokeJavaMethod(rt, ${jsReturnType}, "${propertyName}", "${jniSignature}", args, count, cachedMethodId);
}`;
};

const ModuleClassConstructorTemplate = ({
  hasteModuleName,
  eventEmitters,
  methods,
}: $ReadOnly<{
  hasteModuleName: string,
  eventEmitters: $ReadOnlyArray<NativeModuleEventEmitterShape>,
  methods: $ReadOnlyArray<{
    propertyName: string,
    argCount: number,
  }>,
}>) => {
  return `
${hasteModuleName}SpecJSI::${hasteModuleName}SpecJSI(const JavaTurboModule::InitParams &params)
  : JavaTurboModule(params) {
${methods
  .map(({propertyName, argCount}) => {
    return `  methodMap_["${propertyName}"] = MethodMetadata {${argCount}, __hostFunction_${hasteModuleName}SpecJSI_${propertyName}};`;
  })
  .join('\n')}${
    eventEmitters.length > 0
      ? eventEmitters
          .map(eventEmitter => {
            return `
  eventEmitterMap_["${eventEmitter.name}"] = std::make_shared<AsyncEventEmitter<folly::dynamic>>();`;
          })
          .join('')
      : ''
  }${
    eventEmitters.length > 0
      ? `
  setEventEmitterCallback(params.instance);`
      : ''
  }
}`.trim();
};

const ModuleLookupTemplate = ({
  moduleName,
  hasteModuleName,
}: $ReadOnly<{moduleName: string, hasteModuleName: string}>) => {
  return `  if (moduleName == "${moduleName}") {
    return std::make_shared<${hasteModuleName}SpecJSI>(params);
  }`;
};

const FileTemplate = ({
  libraryName,
  include,
  modules,
  moduleLookups,
}: $ReadOnly<{
  libraryName: string,
  include: string,
  modules: string,
  moduleLookups: $ReadOnlyArray<{
    hasteModuleName: string,
    moduleName: string,
  }>,
}>) => {
  return `
/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateModuleJniCpp.js
 */

#include ${include}

namespace facebook::react {

${modules}

std::shared_ptr<TurboModule> ${libraryName}_ModuleProvider(const std::string &moduleName, const JavaTurboModule::InitParams &params) {
${moduleLookups.map(ModuleLookupTemplate).join('\n')}
  return nullptr;
}

} // namespace facebook::react
`;
};

function translateReturnTypeToKind(
  nullableTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
  resolveAlias: AliasResolver,
): JSReturnType {
  const [typeAnnotation] = unwrapNullable<NativeModuleReturnTypeAnnotation>(
    nullableTypeAnnotation,
  );
  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return 'NumberKind';
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(
            `Invalid ReservedFunctionValueTypeName name, got ${realTypeAnnotation.name}`,
          );
      }
    case 'VoidTypeAnnotation':
      return 'VoidKind';
    case 'StringTypeAnnotation':
      return 'StringKind';
    case 'StringLiteralTypeAnnotation':
      return 'StringKind';
    case 'StringLiteralUnionTypeAnnotation':
      return 'StringKind';
    case 'BooleanTypeAnnotation':
      return 'BooleanKind';
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return 'NumberKind';
        case 'StringTypeAnnotation':
          return 'StringKind';
        default:
          throw new Error(
            `Unknown enum prop type for returning value, found: ${realTypeAnnotation.type}"`,
          );
      }
    case 'UnionTypeAnnotation':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return 'NumberKind';
        case 'ObjectTypeAnnotation':
          return 'ObjectKind';
        case 'StringTypeAnnotation':
          return 'StringKind';
        default:
          throw new Error(
            `Unsupported union member returning value, found: ${realTypeAnnotation.memberType}"`,
          );
      }
    case 'NumberTypeAnnotation':
      return 'NumberKind';
    case 'DoubleTypeAnnotation':
      return 'NumberKind';
    case 'FloatTypeAnnotation':
      return 'NumberKind';
    case 'Int32TypeAnnotation':
      return 'NumberKind';
    case 'PromiseTypeAnnotation':
      return 'PromiseKind';
    case 'GenericObjectTypeAnnotation':
      return 'ObjectKind';
    case 'ObjectTypeAnnotation':
      return 'ObjectKind';
    case 'ArrayTypeAnnotation':
      return 'ArrayKind';
    default:
      (realTypeAnnotation.type: 'MixedTypeAnnotation');
      throw new Error(
        `Unknown prop type for returning value, found: ${realTypeAnnotation.type}"`,
      );
  }
}

type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;

function translateParamTypeToJniType(
  param: Param,
  resolveAlias: AliasResolver,
): string {
  const {optional, typeAnnotation: nullableTypeAnnotation} = param;
  const [typeAnnotation, nullable] =
    unwrapNullable<NativeModuleParamTypeAnnotation>(nullableTypeAnnotation);
  const isRequired = !optional && !nullable;

  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return !isRequired ? 'Ljava/lang/Double;' : 'D';
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(
            `Invalid ReservedFunctionValueTypeName name, got ${realTypeAnnotation.name}`,
          );
      }
    case 'StringTypeAnnotation':
      return 'Ljava/lang/String;';
    case 'StringLiteralTypeAnnotation':
      return 'Ljava/lang/String;';
    case 'StringLiteralUnionTypeAnnotation':
      return 'Ljava/lang/String;';
    case 'BooleanTypeAnnotation':
      return !isRequired ? 'Ljava/lang/Boolean;' : 'Z';
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return !isRequired ? 'Ljava/lang/Double;' : 'D';
        case 'StringTypeAnnotation':
          return 'Ljava/lang/String;';
        default:
          throw new Error(
            `Unknown enum prop type for method arg, found: ${realTypeAnnotation.type}"`,
          );
      }
    case 'UnionTypeAnnotation':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return !isRequired ? 'Ljava/lang/Double;' : 'D';
        case 'ObjectTypeAnnotation':
          return 'Lcom/facebook/react/bridge/ReadableMap;';
        case 'StringTypeAnnotation':
          return 'Ljava/lang/String;';
        default:
          throw new Error(
            `Unsupported union prop value, found: ${realTypeAnnotation.memberType}"`,
          );
      }
    case 'NumberTypeAnnotation':
      return !isRequired ? 'Ljava/lang/Double;' : 'D';
    case 'DoubleTypeAnnotation':
      return !isRequired ? 'Ljava/lang/Double;' : 'D';
    case 'FloatTypeAnnotation':
      return !isRequired ? 'Ljava/lang/Double;' : 'D';
    case 'Int32TypeAnnotation':
      return !isRequired ? 'Ljava/lang/Double;' : 'D';
    case 'GenericObjectTypeAnnotation':
      return 'Lcom/facebook/react/bridge/ReadableMap;';
    case 'ObjectTypeAnnotation':
      return 'Lcom/facebook/react/bridge/ReadableMap;';
    case 'ArrayTypeAnnotation':
      return 'Lcom/facebook/react/bridge/ReadableArray;';
    case 'FunctionTypeAnnotation':
      return 'Lcom/facebook/react/bridge/Callback;';
    default:
      (realTypeAnnotation.type: 'MixedTypeAnnotation');
      throw new Error(
        `Unknown prop type for method arg, found: ${realTypeAnnotation.type}"`,
      );
  }
}

function translateReturnTypeToJniType(
  nullableTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
  resolveAlias: AliasResolver,
): string {
  const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);

  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return nullable ? 'Ljava/lang/Double;' : 'D';
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(
            `Invalid ReservedFunctionValueTypeName name, got ${realTypeAnnotation.name}`,
          );
      }
    case 'VoidTypeAnnotation':
      return 'V';
    case 'StringTypeAnnotation':
      return 'Ljava/lang/String;';
    case 'StringLiteralTypeAnnotation':
      return 'Ljava/lang/String;';
    case 'StringLiteralUnionTypeAnnotation':
      return 'Ljava/lang/String;';
    case 'BooleanTypeAnnotation':
      return nullable ? 'Ljava/lang/Boolean;' : 'Z';
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return nullable ? 'Ljava/lang/Double;' : 'D';
        case 'StringTypeAnnotation':
          return 'Ljava/lang/String;';
        default:
          throw new Error(
            `Unknown enum prop type for method return type, found: ${realTypeAnnotation.type}"`,
          );
      }
    case 'UnionTypeAnnotation':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return nullable ? 'Ljava/lang/Double;' : 'D';
        case 'ObjectTypeAnnotation':
          return 'Lcom/facebook/react/bridge/WritableMap;';
        case 'StringTypeAnnotation':
          return 'Ljava/lang/String;';
        default:
          throw new Error(
            `Unsupported union member type, found: ${realTypeAnnotation.memberType}"`,
          );
      }
    case 'NumberTypeAnnotation':
      return nullable ? 'Ljava/lang/Double;' : 'D';
    case 'DoubleTypeAnnotation':
      return nullable ? 'Ljava/lang/Double;' : 'D';
    case 'FloatTypeAnnotation':
      return nullable ? 'Ljava/lang/Double;' : 'D';
    case 'Int32TypeAnnotation':
      return nullable ? 'Ljava/lang/Double;' : 'D';
    case 'PromiseTypeAnnotation':
      return 'Lcom/facebook/react/bridge/Promise;';
    case 'GenericObjectTypeAnnotation':
      return 'Lcom/facebook/react/bridge/WritableMap;';
    case 'ObjectTypeAnnotation':
      return 'Lcom/facebook/react/bridge/WritableMap;';
    case 'ArrayTypeAnnotation':
      return 'Lcom/facebook/react/bridge/WritableArray;';
    default:
      (realTypeAnnotation.type: 'MixedTypeAnnotation');
      throw new Error(
        `Unknown prop type for method return type, found: ${realTypeAnnotation.type}"`,
      );
  }
}

function translateMethodTypeToJniSignature(
  property: NativeModulePropertyShape,
  resolveAlias: AliasResolver,
): string {
  const {name, typeAnnotation} = property;
  let [{returnTypeAnnotation, params}] =
    unwrapNullable<NativeModuleFunctionTypeAnnotation>(typeAnnotation);

  params = [...params];
  let processedReturnTypeAnnotation = returnTypeAnnotation;
  const isPromiseReturn = returnTypeAnnotation.type === 'PromiseTypeAnnotation';
  if (isPromiseReturn) {
    processedReturnTypeAnnotation = {
      type: 'VoidTypeAnnotation',
    };
  }

  const argsSignatureParts = params.map(t => {
    return translateParamTypeToJniType(t, resolveAlias);
  });
  if (isPromiseReturn) {
    // Additional promise arg for this case.
    argsSignatureParts.push(
      translateReturnTypeToJniType(returnTypeAnnotation, resolveAlias),
    );
  }
  const argsSignature = argsSignatureParts.join('');
  const returnSignature =
    name === 'getConstants'
      ? 'Ljava/util/Map;'
      : translateReturnTypeToJniType(
          processedReturnTypeAnnotation,
          resolveAlias,
        );

  return `(${argsSignature})${returnSignature}`;
}

function translateMethodForImplementation(
  hasteModuleName: string,
  property: NativeModulePropertyShape,
  resolveAlias: AliasResolver,
): string {
  const [propertyTypeAnnotation] =
    unwrapNullable<NativeModuleFunctionTypeAnnotation>(property.typeAnnotation);
  const {returnTypeAnnotation} = propertyTypeAnnotation;

  if (
    property.name === 'getConstants' &&
    returnTypeAnnotation.type === 'ObjectTypeAnnotation' &&
    returnTypeAnnotation.properties.length === 0
  ) {
    return '';
  }

  return HostFunctionTemplate({
    hasteModuleName,
    propertyName: property.name,
    jniSignature: translateMethodTypeToJniSignature(property, resolveAlias),
    jsReturnType: translateReturnTypeToKind(returnTypeAnnotation, resolveAlias),
  });
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
    headerPrefix?: string,
  ): FilesOutput {
    const nativeModules = getModules(schema);

    const modules = Object.keys(nativeModules)
      .filter(hasteModuleName => {
        const module = nativeModules[hasteModuleName];
        return !(
          module.excludedPlatforms != null &&
          module.excludedPlatforms.includes('android')
        );
      })
      .sort()
      .map(hasteModuleName => {
        const {
          aliasMap,
          spec: {eventEmitters, methods},
        } = nativeModules[hasteModuleName];
        const resolveAlias = createAliasResolver(aliasMap);

        const translatedMethods = methods
          .map(property =>
            translateMethodForImplementation(
              hasteModuleName,
              property,
              resolveAlias,
            ),
          )
          .join('\n\n');

        return (
          translatedMethods +
          '\n\n' +
          ModuleClassConstructorTemplate({
            hasteModuleName,
            eventEmitters,
            methods: methods
              .map(({name: propertyName, typeAnnotation}) => {
                const [{returnTypeAnnotation, params}] =
                  unwrapNullable<NativeModuleFunctionTypeAnnotation>(
                    typeAnnotation,
                  );

                if (
                  propertyName === 'getConstants' &&
                  returnTypeAnnotation.type === 'ObjectTypeAnnotation' &&
                  returnTypeAnnotation.properties &&
                  returnTypeAnnotation.properties.length === 0
                ) {
                  return null;
                }

                return {
                  propertyName,
                  argCount: params.length,
                };
              })
              .filter(Boolean),
          })
        );
      })
      .join('\n');

    const moduleLookups: $ReadOnlyArray<{
      hasteModuleName: string,
      moduleName: string,
    }> = Object.keys(nativeModules)
      .filter(hasteModuleName => {
        const module = nativeModules[hasteModuleName];
        return !(
          module.excludedPlatforms != null &&
          module.excludedPlatforms.includes('android')
        );
      })
      .sort((a, b) => {
        const nameA = nativeModules[a].moduleName;
        const nameB = nativeModules[b].moduleName;
        if (nameA < nameB) {
          return -1;
        } else if (nameA > nameB) {
          return 1;
        }
        return 0;
      })
      .map((hasteModuleName: string) => ({
        moduleName: nativeModules[hasteModuleName].moduleName,
        hasteModuleName,
      }));

    const fileName = `${libraryName}-generated.cpp`;
    const replacedTemplate = FileTemplate({
      modules: modules,
      libraryName: libraryName.replace(/-/g, '_'),
      moduleLookups,
      include: `"${libraryName}.h"`,
    });
    return new Map([[`jni/${fileName}`, replacedTemplate]]);
  },
};
