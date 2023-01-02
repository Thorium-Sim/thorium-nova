import type {
  AnyProcedure,
  Procedure,
  ProcedureArgs,
  ProcedureParams,
} from "./procedure";
import type {BuildProcedure} from "./procedureBuilder";
import type {AnyRouter, AnyRouterDef, Router} from "./router";

export interface RootConfigTypes {
  ctx: any;
  meta: Record<string, unknown>;
  entity: any;
}

/**
 * The runtime config that are used and actually represents real values underneath
 * @internal
 */
export interface RuntimeConfig {
  /**
   * Allow `@trpc/server` to run in non-server environments
   * @warning **Use with caution**, this should likely mainly be used within testing.
   * @default false
   */
  allowOutsideOfServer: boolean;
  /**
   * Is this a server environment?
   * @warning **Use with caution**, this should likely mainly be used within testing.
   * @default typeof window === 'undefined' || 'Deno' in window || process.env.NODE_ENV === 'test'
   */
  isServer: boolean;
  /**
   * Is this development?
   * Will be used to decide if the API should return stack traces
   * @default process.env.NODE_ENV !== 'production'
   */
  isDev: boolean;
}

/**
 * The config that is resolved after `initTRPC.create()` has been called
 * Combination of `InitTOptions` + `InitGenerics`
 * @internal
 */
export interface RootConfig<TGenerics extends RootConfigTypes>
  extends RuntimeConfig {
  $types: TGenerics;
}

/**
 * @internal
 */
export type AnyRootConfig = RootConfig<{
  ctx: any;
  meta: any;
  entity: any;
}>;

export const procedureTypes = ["request", "send", "dataStream"] as const;
/**
 * @public
 */
export type ProcedureType = typeof procedureTypes[number];

/**
 * @internal
 * @see https://github.com/ianstormtaylor/superstruct/blob/7973400cd04d8ad92bbdc2b6f35acbfb3c934079/src/utils.ts#L323-L325
 */
export type Simplify<TType> = TType extends any[] | Date
  ? TType
  : {[K in keyof TType]: TType[K]} & {};

/**
 * @internal
 */
export type Overwrite<TType, TWith> = Omit<TType, keyof TWith> & TWith;

/**
 * @public
 */
export type MaybePromise<TType> = TType | Promise<TType>;

export type InferOptional<TType, TKeys extends keyof TType> = Partial<
  Pick<TType, TKeys>
> &
  Omit<TType, TKeys>;

export type UndefinedKeys<TType> = {
  [K in keyof TType]: undefined extends TType[K] ? K : never;
}[keyof TType];

export type inferRouterDef<TRouter extends AnyRouter> = TRouter extends Router<
  infer TParams
>
  ? TParams extends AnyRouterDef<any>
    ? TParams
    : never
  : never;

export type inferRouterContext<TRouter extends AnyRouter> =
  inferRouterDef<TRouter>["_config"]["$types"]["ctx"];
export type inferRouterMeta<TRouter extends AnyRouter> =
  inferRouterDef<TRouter>["_config"]["$types"]["meta"];
export type inferRouterEntity<TRouter extends AnyRouter> =
  inferRouterDef<TRouter>["_config"]["$types"]["entity"];

/**
 * @public
 */
export type inferAsyncReturnType<TFunction extends (...args: any) => any> =
  ThenArg<ReturnType<TFunction>>;

/**
 * @internal
 */
export type ThenArg<TType> = TType extends PromiseLike<infer U>
  ? ThenArg<U>
  : TType;

type GetInferenceHelpers<
  TType extends "input" | "output",
  TRouter extends AnyRouter
> = {
  [TKey in keyof TRouter["_def"]["record"]]: TRouter["_def"]["record"][TKey] extends infer TRouterOrProcedure
    ? TRouterOrProcedure extends AnyRouter
      ? GetInferenceHelpers<TType, TRouterOrProcedure>
      : TRouterOrProcedure extends AnyProcedure
      ? TType extends "input"
        ? inferProcedureInput<TRouterOrProcedure>
        : inferTransformedProcedureOutput<TRouterOrProcedure>
      : never
    : never;
};

export type inferRouterInputs<TRouter extends AnyRouter> = GetInferenceHelpers<
  "input",
  TRouter
>;

export type inferRouterOutputs<TRouter extends AnyRouter> = GetInferenceHelpers<
  "output",
  TRouter
>;

export type inferHandlerInput<TProcedure extends AnyProcedure> = ProcedureArgs<
  inferProcedureParams<TProcedure>
>;

export type inferProcedureInput<TProcedure extends AnyProcedure> =
  inferHandlerInput<TProcedure>[0];

export type inferProcedureParams<TProcedure> = TProcedure extends AnyProcedure
  ? TProcedure["_def"]
  : never;

/**
 * @internal
 */
export type inferTransformedProcedureOutput<TProcedure extends AnyProcedure> =
  TProcedure["_def"]["_output_out"];

export type RouterRequests<TRouter extends AnyRouter> = {
  [P in keyof TRouter as TRouter[P] extends
    | BuildProcedure<"request", any, any>
    | AnyRouter
    ? P
    : never]: TRouter[P] extends Procedure<"request", ProcedureParams>
    ? (
        params: TRouter[P]["_def"]["_input_in"]
      ) => TRouter[P]["_def"]["_output_out"]
    : TRouter[P] extends AnyRouter
    ? RouterRequests<TRouter[P]>
    : never;
};
export type RouterSends<TRouter extends AnyRouter> = {
  [P in keyof TRouter as TRouter[P] extends
    | BuildProcedure<"send", any, any>
    | AnyRouter
    ? P
    : never]: TRouter[P] extends Procedure<"send", ProcedureParams>
    ? TRouter[P]
    : TRouter[P] extends AnyRouter
    ? RouterSends<TRouter[P]>
    : never;
};
