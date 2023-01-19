import {ZodError} from "zod";
import {ParseFn} from "./getParseFn";
import {ProcedureBuilderMiddleware, ProcedureParams} from "./procedure";
import {AnyRootConfig, ProcedureType} from "./types";

/**
 * @internal
 */
export type MiddlewareResult<TParams extends ProcedureParams> =
  | MiddlewareOKResult<TParams>
  | MiddlewareErrorResult<TParams>;

/**
 * @internal
 */
interface MiddlewareOKResult<_TParams extends ProcedureParams>
  extends MiddlewareResultBase {
  ok: true;
  data: unknown;
  // this could be extended with `input`/`rawInput` later
}

/**
 * @internal
 */
interface MiddlewareErrorResult<_TParams extends ProcedureParams>
  extends MiddlewareResultBase {
  ok: false;
  error: Error;
}

/**
 * @internal
 */
interface MiddlewareResultBase {
  /**
   * All middlewares should pass through their `next()`'s output.
   * Requiring this marker makes sure that can't be forgotten at compile-time.
   */
  readonly marker: MiddlewareMarker;
}

/**
 * @internal
 */
export const middlewareMarker = "middlewareMarker" as "middlewareMarker" & {
  __brand: "middlewareMarker";
};

/**
 * @internal
 */
export type MiddlewareMarker = typeof middlewareMarker;

/**
 * @internal
 */
export type MiddlewareFunction<
  TParams extends ProcedureParams,
  TParamsAfter extends ProcedureParams
> = {
  (opts: {
    ctx: TParams["_ctx_out"];
    type: ProcedureType;
    path: string;
    input: TParams["_input_out"];
    rawInput: unknown;
    meta: TParams["_meta"] | undefined;
    publish: TParams["_publish"];
    entity: TParams["_entity"];
    next: {
      (): Promise<MiddlewareResult<TParams>>;
      <$Context>(opts: {ctx: $Context}): Promise<
        MiddlewareResult<{
          _config: TParams["_config"];
          _ctx_out: $Context;
          _input_in: TParams["_input_in"];
          _input_out: TParams["_input_out"];
          _output_in: TParams["_output_in"];
          _output_out: TParams["_output_out"];
          _meta: TParams["_meta"];
          _publish: TParams["_publish"];
          _entity: TParams["_entity"];
        }>
      >;
    };
  }): Promise<MiddlewareResult<TParamsAfter>>;
  _type?: string | undefined;
};

/**
 * @internal
 */
// FIXME this should use RootConfig
export function createMiddlewareFactory<TConfig extends AnyRootConfig>() {
  return function createMiddleware<TNewParams extends ProcedureParams>(
    fn: MiddlewareFunction<
      {
        _config: TConfig;
        _ctx_out: TConfig["$types"]["ctx"];
        _input_out: unknown;
        _input_in: unknown;
        _output_in: unknown;
        _output_out: unknown;
        _meta: TConfig["$types"]["meta"];
        _publish: unknown;
        _entity: unknown;
      },
      TNewParams
    >
  ) {
    return fn;
  };
}

function isPlainObject(obj: unknown) {
  return obj && typeof obj === "object" && !Array.isArray(obj);
}

/**
 * @internal
 * Please note, `trpc-openapi` uses this function.
 */
export function createInputMiddleware<TInput>(parse: ParseFn<TInput>) {
  const inputMiddleware: ProcedureBuilderMiddleware = async ({
    next,
    rawInput,
    input,
  }) => {
    let parsedInput: ReturnType<typeof parse>;
    try {
      parsedInput = await parse(rawInput);
    } catch (cause) {
      if (cause instanceof ZodError) {
        throw cause;
      }
      throw new Error("Input Validation Error");
    }

    // Multiple input parsers
    const combinedInput =
      isPlainObject(input) && isPlainObject(parsedInput)
        ? {
            ...input,
            ...parsedInput,
          }
        : parsedInput;

    // TODO fix this typing?
    return next({input: combinedInput} as any);
  };
  inputMiddleware._type = "input";
  return inputMiddleware;
}

/**
 * @internal
 */
export function createOutputMiddleware<TOutput>(parse: ParseFn<TOutput>) {
  const outputMiddleware: ProcedureBuilderMiddleware = async ({next}) => {
    const result = await next();
    if (!result.ok) {
      // pass through failures without validating
      return result;
    }
    try {
      const data = await parse(result.data);
      return {
        ...result,
        data,
      };
    } catch (cause) {
      throw new Error("Output validation failed");
    }
  };
  outputMiddleware._type = "output";
  return outputMiddleware;
}
