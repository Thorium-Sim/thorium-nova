import {createFlatProxy} from "../proxy";
import {createMiddlewareFactory} from "./middleware";
import {createBuilder} from "./procedureBuilder";
import {createRouterFactory} from "./router";
import {
  InferOptional,
  RootConfig,
  RootConfigTypes,
  RuntimeConfig,
  UndefinedKeys,
} from "./types";

/**
 * @internal
 */
type FlatOverwrite<TType, TWith> = InferOptional<
  {
    [TKey in keyof TWith | keyof TType]: TKey extends keyof TWith
      ? TWith[TKey]
      : TKey extends keyof TType
      ? TType[TKey]
      : never;
  },
  UndefinedKeys<TType> | UndefinedKeys<TWith>
>;

/**
 * @internal
 */
type CreateRootConfigTypes<TGenerics extends RootConfigTypes> = TGenerics;

type CreateRootConfigTypesFromPartial<TTypes extends Partial<RootConfigTypes>> =
  CreateRootConfigTypes<{
    ctx: TTypes["ctx"] extends RootConfigTypes["ctx"] ? TTypes["ctx"] : {};
    meta: TTypes["meta"] extends RootConfigTypes["meta"] ? TTypes["meta"] : {};
    entity: TTypes["entity"] extends RootConfigTypes["entity"]
      ? TTypes["entity"]
      : {};
  }>;

/**
 * @internal
 */
type ValidateShape<TActualShape, TExpectedShape> =
  TActualShape extends TExpectedShape
    ? Exclude<keyof TActualShape, keyof TExpectedShape> extends never
      ? TActualShape
      : TExpectedShape
    : never;

class LiveQueryBuilder<TParams extends Partial<RootConfigTypes> = {}> {
  context<TNewContext extends RootConfigTypes["ctx"]>() {
    return new LiveQueryBuilder<FlatOverwrite<TParams, {ctx: TNewContext}>>();
  }
  meta<TNewMeta extends RootConfigTypes["meta"]>() {
    return new LiveQueryBuilder<FlatOverwrite<TParams, {meta: TNewMeta}>>();
  }
  dataStreamEntity<TNewEntity extends RootConfigTypes["entity"]>() {
    return new LiveQueryBuilder<FlatOverwrite<TParams, {entity: TNewEntity}>>();
  }
  create<TOptions extends Partial<RuntimeConfig>>(
    options?: ValidateShape<TOptions, Partial<RuntimeConfig>> | undefined
  ) {
    return createTRPCInner<TParams>()<TOptions>(options);
  }
}

/**
 * Initialize Live Query - be done exactly once per backend
 */
export const initLiveQuery = new LiveQueryBuilder();

/**
 * The default check to see if we're in a server
 */
const isServerDefault: boolean =
  typeof window === "undefined" ||
  "Deno" in window ||
  globalThis.process?.env?.NODE_ENV === "test" ||
  !!globalThis.process?.env?.JEST_WORKER_ID;

const noop = () => {
  // noop
};

function createTRPCInner<TParams extends Partial<RootConfigTypes>>() {
  type $Generics = CreateRootConfigTypesFromPartial<TParams>;

  type $Context = $Generics["ctx"];
  type $Meta = $Generics["meta"];
  type $Entity = $Generics["entity"];
  type $Runtime = Partial<RuntimeConfig>;

  return function initTRPCInner<TOptions extends $Runtime>(
    runtime?: ValidateShape<TOptions, $Runtime>
  ) {
    type $Config = RootConfig<{
      ctx: $Context;
      meta: $Meta;
      entity: $Entity;
    }>;

    const config: $Config = {
      isDev:
        runtime?.isDev ?? globalThis.process?.env?.NODE_ENV !== "production",
      allowOutsideOfServer: runtime?.allowOutsideOfServer ?? false,
      isServer: runtime?.isServer ?? isServerDefault,
      /**
       * @internal
       */
      $types: createFlatProxy(key => {
        throw new Error(
          `Tried to access "$types.${key}" which is not available at runtime`
        );
      }),
    };

    {
      // Server check
      const isServer: boolean = runtime?.isServer ?? isServerDefault;

      if (!isServer && runtime?.allowOutsideOfServer !== true) {
        throw new Error(
          `You're trying to use @live-query/server in a non-server environment. This is not supported by default.`
        );
      }
    }
    return {
      /**
       * These are just types, they can't be used
       * @internal
       */
      _config: config,
      /**
       * Builder object for creating procedures
       */
      procedure: createBuilder<$Config>(),
      /**
       * Create reusable middlewares
       */
      middleware: createMiddlewareFactory<$Config>(),
      /**
       * Create a router
       */
      router: createRouterFactory<$Config>(config),
    };
  };
}
