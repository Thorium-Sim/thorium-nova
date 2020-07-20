"use strict";

Object.defineProperty(exports, "__esModule", {value: true});

function _interopDefault(ex) {
  return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
}

const graphql = require("graphql");
const visitorPluginCommon = require("@graphql-codegen/visitor-plugin-common");
const autoBind = _interopDefault(require("auto-bind"));
const pascalCase = require("pascal-case");
const path = require("path");

class GraphQLHooksVisitor extends visitorPluginCommon.ClientSideBaseVisitor {
  constructor(schema, fragments, rawConfig, documents) {
    super(schema, fragments, rawConfig, {
      hooksImportFrom: visitorPluginCommon.getConfigValue(
        rawConfig.hooksImportFrom,
        "../helpers/graphqlHooks",
      ),
    });
    this.imports = new Set();
    this._externalImportPrefix = this.config.importOperationTypesFrom
      ? `${this.config.importOperationTypesFrom}.`
      : "";
    this._documents = documents;
    autoBind(this);
  }
  getReactImport() {
    return `import * as React from 'react';`;
  }
  getGraphQLHooksImport() {
    return `import * as GraphQLHooks from '${this.config.hooksImportFrom}';`;
  }
  getOmitDeclaration() {
    return visitorPluginCommon.OMIT_TYPE;
  }
  getDocumentNodeVariable(node, documentVariableName) {
    return this.config.documentMode ===
      visitorPluginCommon.DocumentMode.external
      ? `Operations.${node.name.value}`
      : documentVariableName;
  }
  getImports() {
    const baseImports = super.getImports();
    const hasOperations = this._collectedOperations.length > 0;
    if (!hasOperations) {
      return baseImports;
    }
    return [...baseImports, ...Array.from(this.imports)];
  }

  _buildHooks(
    node,
    operationType,
    documentVariableName,
    operationResultType,
    operationVariablesTypes,
  ) {
    const suffix = this._getHookSuffix(node.name.value, operationType);
    const operationName = this.convertName(node.name.value, {
      suffix,
      useTypesPrefix: false,
    });
    this.imports.add(this.getGraphQLHooksImport());
    const hookFns = [
      `export function use${operationName}(baseOptions?: GraphQLHooks.${operationType}HookOptions<${operationResultType}, ${operationVariablesTypes}>) {
        return GraphQLHooks.use${operationType}<${operationResultType}, ${operationVariablesTypes}>(${this.getDocumentNodeVariable(
        node,
        documentVariableName,
      )}, baseOptions);
      }`,
    ];
    const hookResults = [
      `export type ${operationName}HookResult = ReturnType<typeof use${operationName}>;`,
    ];
    if (operationType === "Query") {
      const lazyOperationName = this.convertName(node.name.value, {
        suffix: pascalCase.pascalCase("LazyQuery"),
        useTypesPrefix: false,
      });
      hookFns.push(`export function use${lazyOperationName}(baseOptions?: GraphQLHooks.LazyQueryHookOptions<${operationResultType}, ${operationVariablesTypes}>) {
          return GraphQLHooks.useLazyQuery<${operationResultType}, ${operationVariablesTypes}>(${this.getDocumentNodeVariable(
        node,
        documentVariableName,
      )}, baseOptions);
        }`);
      hookResults.push(
        `export type ${lazyOperationName}HookResult = ReturnType<typeof use${lazyOperationName}>;`,
      );
    }
    if (operationType === "Subscription") {
      const lazyOperationName = this.convertName(node.name.value, {
        suffix: pascalCase.pascalCase("TSubscription"),
        useTypesPrefix: false,
      });
      hookFns.push(`export function use${lazyOperationName}(baseOptions?: GraphQLHooks.SubscriptionHookOptions<${operationResultType}, ${operationVariablesTypes}>) {
          return GraphQLHooks.useTSubscription<${operationResultType}, ${operationVariablesTypes}>(${this.getDocumentNodeVariable(
        node,
        documentVariableName,
      )}, baseOptions);
        }`);
      hookResults.push(
        `export type ${lazyOperationName}HookResult = ReturnType<typeof use${lazyOperationName}>;`,
      );
    }
    return [...hookFns, ...hookResults].join("\n");
  }
  _getHookSuffix(name, operationType) {
    if (this.config.omitOperationSuffix) {
      return "";
    }
    if (!this.config.dedupeOperationSuffix) {
      return pascalCase.pascalCase(operationType);
    }
    if (
      name.includes("Query") ||
      name.includes("Mutation") ||
      name.includes("Subscription")
    ) {
      return "";
    }
    return pascalCase.pascalCase(operationType);
  }

  buildOperation(
    node,
    documentVariableName,
    operationType,
    operationResultType,
    operationVariablesTypes,
  ) {
    operationResultType = this._externalImportPrefix + operationResultType;
    operationVariablesTypes =
      this._externalImportPrefix + operationVariablesTypes;

    return this._buildHooks(
      node,
      operationType,
      documentVariableName,
      operationResultType,
      operationVariablesTypes,
    );
  }
}

const plugin = (schema, documents, config) => {
  const allAst = graphql.concatAST(documents.map(v => v.document));
  const allFragments = [
    ...allAst.definitions
      .filter(d => d.kind === graphql.Kind.FRAGMENT_DEFINITION)
      .map(fragmentDef => ({
        node: fragmentDef,
        name: fragmentDef.name.value,
        onType: fragmentDef.typeCondition.name.value,
        isExternal: false,
      })),
    ...(config.externalFragments || []),
  ];
  const visitor = new GraphQLHooksVisitor(
    schema,
    allFragments,
    config,
    documents,
  );
  const visitorResult = graphql.visit(allAst, {leave: visitor});
  return {
    prepend: visitor.getImports(),
    content: [
      visitor.fragments,
      ...visitorResult.definitions.filter(t => typeof t === "string"),
    ].join("\n"),
  };
};
const validate = async (schema, documents, config, outputFile) => {
  if (path.extname(outputFile) !== ".tsx") {
    throw new Error(`Plugin "graphql-hooks" requires extension to be ".tsx"!`);
  }
};

exports.GraphQLHooksVisitor = GraphQLHooksVisitor;
exports.plugin = plugin;
exports.validate = validate;
//# sourceMappingURL=index.cjs.js.map
