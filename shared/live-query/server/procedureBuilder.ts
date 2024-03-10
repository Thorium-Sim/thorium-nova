import {getParseFn} from "./getParseFn";
import {
  createInputMiddleware,
  createOutputMiddleware,
  type 
  MiddlewareFunction,
  middlewareMarker,
  type 
  MiddlewareResult,
} from "./middleware";
import type {inferParser, Parser} from "./parser";
import type {
  AnyDataStreamProcedure,
  AnyProcedure,
  AnyRequestProcedure,
  AnySendProcedure,
  Procedure,
  ProcedureBuilderDef,
  ProcedureCallOptions,
  ProcedureParams,
  ResolveOptions,
  UnsetMarker,
} from "./procedure";
import type {
  AnyRootConfig,
  InferOptional,
  MaybePromise,
  Overwrite,
  ProcedureType,
  Simplify,
  UndefinedKeys,
} from "./types";

type ErrorMessage<TMessage extends string> = TMessage;

/**
 * @internal
 */
export interface BuildProcedure<
  TType extends ProcedureType,
  TParams extends ProcedureParams,
  TOutput
> extends Procedure<
    TType,
    UnsetMarker extends TParams["_output_out"]
      ? OverwriteKnown<
          TParams,
          {
            _output_in: TOutput;
            _output_out: TOutput;
          }
        >
      : TParams
  > {
  _empty?: never;
}

type Merge<TType, TWith> = {
  [TKey in keyof TType | keyof TWith]: TKey extends keyof TType
    ? TKey extends keyof TWith
      ? TType[TKey] & TWith[TKey]
      : TType[TKey]
    : TWith[TKey & keyof TWith];
};

/**
 * @internal
 */
export type OverwriteKnown<TType, TWith> = {
  [K in keyof TType]: K extends keyof TWith ? TWith[K] : TType[K];
};

type OverwriteIfDefined<TType, TWith> = UnsetMarker extends TType
  ? TWith
  : Simplify<
      InferOptional<Merge<TType, TWith>, UndefinedKeys<Merge<TType, TWith>>>
    >;

/**
 * @internal
 */
export type FallbackValue<TValue, TFallback> = UnsetMarker extends TValue
  ? TFallback
  : TValue;

type AnyProcedureBuilder = ProcedureBuilder<any>;

export type AnyProcedureBuilderDef = ProcedureBuilderDef<any>;

type CreateProcedureReturnInput<
  TPrev extends ProcedureParams,
  TNext extends ProcedureParams
> = ProcedureBuilder<{
  _config: TPrev["_config"];
  _meta: TPrev["_meta"];
  _publish: TPrev["_publish"];
  _entity: TPrev["_entity"];
  _ctx_out: Overwrite<TPrev["_ctx_out"], TNext["_ctx_out"]>;
  _input_in: FallbackValue<TNext["_input_in"], TPrev["_input_in"]>;
  _input_out: FallbackValue<TNext["_input_out"], TPrev["_input_out"]>;
  _output_in: FallbackValue<TNext["_output_in"], TPrev["_output_in"]>;
  _output_out: FallbackValue<TNext["_output_out"], TPrev["_output_out"]>;
}>;

export interface ProcedureBuilder<TParams extends ProcedureParams> {
  /**
   * Add an input parser to the procedure.
   */
  input<$Parser extends Parser>(
    schema: TParams["_input_out"] extends UnsetMarker
      ? $Parser
      : inferParser<$Parser>["out"] extends Record<string, unknown>
      ? TParams["_input_out"] extends Record<string, unknown>
        ? $Parser
        : ErrorMessage<"All input parsers did not resolve to an object">
      : ErrorMessage<"All input parsers did not resolve to an object">
  ): ProcedureBuilder<{
    _config: TParams["_config"];
    _meta: TParams["_meta"];
    _publish: TParams["_publish"];
    _entity: TParams["_entity"];
    _ctx_out: TParams["_ctx_out"];
    _input_in: OverwriteIfDefined<
      TParams["_input_in"],
      inferParser<$Parser>["in"]
    >;
    _input_out: OverwriteIfDefined<
      TParams["_input_out"],
      inferParser<$Parser>["out"]
    >;

    _output_in: TParams["_output_in"];
    _output_out: TParams["_output_out"];
  }>;
  /**
   * Add an output parser to the procedure.
   */
  output<$Parser extends Parser>(
    schema: $Parser
  ): ProcedureBuilder<{
    _config: TParams["_config"];
    _meta: TParams["_meta"];
    _publish: TParams["_publish"];
    _entity: TParams["_entity"];
    _ctx_out: TParams["_ctx_out"];
    _input_in: TParams["_input_in"];
    _input_out: TParams["_input_out"];
    _output_in: inferParser<$Parser>["in"];
    _output_out: inferParser<$Parser>["out"];
  }>;
  /**
   * Add a meta data to the procedure.
   */
  meta(meta: TParams["_meta"]): ProcedureBuilder<TParams>;
  /**
   * Filter pubsub.publish calls so only certain clients get
   * subscription publishes
   */
  filter<$Publish>(
    resolver: (
      publish: $Publish,
      opts: ResolveOptions<TParams> & {publish: $Publish}
    ) => MaybePromise<boolean>
  ): ProcedureBuilder<{
    _config: TParams["_config"];
    _meta: TParams["_meta"];
    _publish: $Publish;
    _entity: TParams["_entity"];
    _ctx_out: TParams["_ctx_out"];
    _input_in: TParams["_input_in"];
    _input_out: TParams["_input_out"];
    _output_in: TParams["_output_in"];
    _output_out: TParams["_output_out"];
  }>;
  /**
   * Add a middleware to the procedure.
   */
  use<$Params extends ProcedureParams>(
    fn: MiddlewareFunction<TParams, $Params>
  ): CreateProcedureReturnInput<TParams, $Params>;
  /**
   * Extend the procedure with another procedure.
   * @warning The TypeScript inference fails when chaining concatenated procedures.
   */
  unstable_concat<$ProcedureBuilder extends AnyProcedureBuilder>(
    proc: $ProcedureBuilder
  ): $ProcedureBuilder extends ProcedureBuilder<infer $TParams>
    ? CreateProcedureReturnInput<TParams, $TParams>
    : never;
  /**
   * Request procedure
   */
  request<$Output>(
    resolver: (
      opts: ResolveOptions<TParams>
    ) => MaybePromise<FallbackValue<TParams["_output_in"], $Output>>
  ): BuildProcedure<"request", TParams, $Output>;

  /**
   * Send procedure
   */
  send<$Output>(
    resolver: (
      opts: ResolveOptions<TParams>
    ) => MaybePromise<FallbackValue<TParams["_output_in"], $Output>>
  ): BuildProcedure<"send", TParams, $Output>;

  /**
   * DataStream procedure
   */
  dataStream(
    resolver: (
      opts: ResolveOptions<TParams>
    ) => MaybePromise<FallbackValue<TParams["_output_in"], boolean>>
  ): BuildProcedure<"dataStream", TParams, boolean>;
  /**
   * @internal
   */
  _def: ProcedureBuilderDef<TParams>;
}
/**
 * Ensures there are no duplicate keys when building a procedure.
 */
export function mergeWithoutOverrides<TType extends Record<string, unknown>>(
  obj1: TType,
  ...objs: Partial<TType>[]
): TType {
  const newObj: TType = Object.assign(Object.create(null), obj1);

  for (const overrides of objs) {
    for (const key in overrides) {
      if (key in newObj && newObj[key] !== overrides[key]) {
        throw new Error(`Duplicate key ${key}`);
      }
      newObj[key as keyof TType] = overrides[key] as TType[keyof TType];
    }
  }
  return newObj;
}

function createNewBuilder(
  def1: AnyProcedureBuilderDef,
  def2: Partial<AnyProcedureBuilderDef>
) {
  const {middlewares = [], inputs, ...rest} = def2;

  // TODO: maybe have a fn here to warn about calls
  return createBuilder({
    ...mergeWithoutOverrides(def1, rest),
    inputs: [...def1.inputs, ...(inputs ?? [])],
    middlewares: [...def1.middlewares, ...middlewares],
  } as any);
}

export function createBuilder<TConfig extends AnyRootConfig>(
  initDef?: AnyProcedureBuilderDef
): ProcedureBuilder<{
  _config: TConfig;
  _ctx_out: TConfig["$types"]["ctx"];
  _input_in: UnsetMarker;
  _input_out: UnsetMarker;
  _output_in: UnsetMarker;
  _output_out: UnsetMarker;
  _meta: TConfig["$types"]["meta"];
  _publish: UnsetMarker;
  _entity: TConfig["$types"]["entity"];
}> {
  const _def: AnyProcedureBuilderDef = initDef || {
    inputs: [],
    middlewares: [],
  };

  return {
    _def,
    input(input) {
      const parser = getParseFn(input);
      return createNewBuilder(_def, {
        inputs: [input],
        middlewares: [createInputMiddleware(parser)],
      }) as AnyProcedureBuilder;
    },
    output(output: Parser) {
      const parseOutput = getParseFn(output);
      return createNewBuilder(_def, {
        output,
        middlewares: [createOutputMiddleware(parseOutput)],
      }) as AnyProcedureBuilder;
    },
    meta(meta) {
      return createNewBuilder(_def, {
        meta: meta as Record<string, unknown>,
      }) as AnyProcedureBuilder;
    },
    filter(filter) {
      return createNewBuilder(_def, {
        middlewares: [
          async function filterMiddleware(opts) {
            const shouldRun = await filter(opts.publish, opts);
            if (!shouldRun) throw null;
            return opts.next();
          },
        ],
      }) as AnyProcedureBuilder;
    },
    unstable_concat(builder) {
      return createNewBuilder(_def, builder._def) as any;
    },
    use(middleware) {
      return createNewBuilder(_def, {
        middlewares: [middleware],
      }) as AnyProcedureBuilder;
    },
    request(resolver) {
      return createResolver(
        {..._def, request: true},
        resolver
      ) as AnyRequestProcedure;
    },
    send(resolver) {
      return createResolver(
        {..._def, send: true},
        resolver
      ) as AnySendProcedure;
    },
    dataStream(resolver) {
      return createResolver(
        {..._def, dataStream: true},
        resolver
      ) as AnyDataStreamProcedure;
    },
  };
}

function createResolver(
  _def: AnyProcedureBuilderDef,
  resolver: (opts: ResolveOptions<any>) => MaybePromise<any>
) {
  const finalBuilder = createNewBuilder(_def, {
    resolver,
    middlewares: [
      async function resolveMiddleware(opts) {
        const data = await resolver(opts);
        return {
          marker: middlewareMarker,
          ok: true,
          data,
          ctx: opts.ctx,
        } as const;
      },
    ],
  });

  return createProcedureCaller(finalBuilder._def);
}

const codeblock = `
If you want to call this function on the server, you do the following:
This is a client-only function.

const caller = appRouter.createCaller({
  /* ... your context */
});

const result = await caller.call('myProcedure', input);
`.trim();

function createProcedureCaller(_def: AnyProcedureBuilderDef): AnyProcedure {
  const procedure = async function resolve(opts: ProcedureCallOptions) {
    // is direct server-side call
    if (!opts || !("rawInput" in opts)) {
      throw new Error(codeblock);
    }

    // run the middlewares recursively with the resolver as the last one
    const callRecursive = async (
      callOpts: {ctx: any; index: number; input?: unknown} = {
        index: 0,
        ctx: opts.ctx,
      }
    ): Promise<MiddlewareResult<any>> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const middleware = _def.middlewares[callOpts.index]!;
        const result = await middleware({
          ctx: callOpts.ctx,
          type: opts.type,
          path: opts.path,
          rawInput: opts.rawInput,
          meta: _def.meta,
          input: callOpts.input,
          publish: opts.publish,
          entity: opts.entity,
          next: async (nextOpts?: {ctx: any; input?: any}) => {
            return await callRecursive({
              index: callOpts.index + 1,
              ctx:
                nextOpts && "ctx" in nextOpts
                  ? {...callOpts.ctx, ...nextOpts.ctx}
                  : callOpts.ctx,
              input:
                nextOpts && "input" in nextOpts
                  ? nextOpts.input
                  : callOpts.input,
            });
          },
        });
        return result;
      } catch (cause) {
        return {
          ok: false,
          error: cause as Error,
          marker: middlewareMarker,
        };
      }
    };

    // there's always at least one "next" since we wrap this.resolver in a middleware
    const result = await callRecursive();

    if (!result) {
      throw new Error(
        "No result from middlewares - did you forget to `return next()`?"
      );
    }
    if (!result.ok) {
      // re-throw original error
      throw result.error;
    }
    return result.data;
  };
  procedure._def = _def;
  procedure.meta = _def.meta;

  return procedure as AnyProcedure;
}
