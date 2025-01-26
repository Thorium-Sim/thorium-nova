import type { HeadersResolver } from "../client/client";
import type { MiddlewareFunction } from "./middleware";
import type { Parser } from "./parser";
import type { AnyRootConfig, ProcedureType } from "./types";

/**
 * @internal
 */
export interface ResolveOptions<TParams extends ProcedureParams> {
	ctx: TParams["_ctx_out"];
	input: TParams["_input_out"];
	publish?: TParams["_publish"];
	entity?: TParams["_entity"];
}

export type ProcedureBuilderResolver = (
	opts: ResolveOptions<any>,
) => Promise<unknown>;

export type ProcedureBuilderFilter = (
	publish: unknown,
	opts: ResolveOptions<any>,
) => Promise<boolean>;

export type ProcedureBuilderMiddleware = MiddlewareFunction<any, any>;

export type ProcedureBuilderDef<TParams extends ProcedureParams> = {
	inputs: Parser[];
	output?: Parser;
	meta?: TParams["_meta"];
	resolver?: ProcedureBuilderResolver;
	middlewares: ProcedureBuilderMiddleware[];
	send?: boolean;
	request?: boolean;
	dataStream?: boolean;
};

/**
 * FIXME: this should only take 1 generic argument instead of a list
 * @internal
 */
export interface ProcedureParams<
	TConfig extends AnyRootConfig = AnyRootConfig,
	TContextOut = unknown,
	TInputIn = unknown,
	TInputOut = unknown,
	TOutputIn = unknown,
	TOutputOut = unknown,
	TMeta = unknown,
	TPublish = unknown,
	TEntity = unknown,
> {
	_config: TConfig;
	/**
	 * @internal
	 */
	_meta: TMeta;
	/**
	 * @internal
	 */
	_ctx_out: TContextOut;
	/**
	 * @internal
	 */
	_input_in: TInputIn;
	/**
	 * @internal
	 */
	_input_out: TInputOut;
	/**
	 * @internal
	 */
	_output_in: TOutputIn;
	/**
	 * @internal
	 */
	_output_out: TOutputOut;
	/**
	 * @internal
	 */
	_publish?: TPublish;
	/**
	 * @internal
	 */
	_entity?: TEntity;
}

/**
 * @internal
 */
export interface ProcedureCallOptions {
	ctx: unknown;
	rawInput: unknown;
	input?: unknown;
	publish?: unknown;
	entity?: unknown;
	path: string;
	type: ProcedureType;
	onCall?: (opts: ProcedureCallOptions) => void | Promise<void>;
}

/**
 * @internal
 */
export const unsetMarker = Symbol("unsetMarker");
/**
 * @internal
 */
export type UnsetMarker = typeof unsetMarker;

/**
 * @internal
 */
export interface ProcedureOptions {
	/**
	 * Client-side context
	 */
	headers?: HeadersResolver;
	signal?: AbortSignal;
}

/**
 * @internal
 */
export type ProcedureArgs<TParams extends ProcedureParams> =
	TParams["_input_in"] extends UnsetMarker
		? // biome-ignore lint/suspicious/noConfusingVoidType: Necessary for this to work correctly
		  [input?: undefined | void, opts?: ProcedureOptions]
		: undefined extends TParams["_input_in"]
		  ? // biome-ignore lint/suspicious/noConfusingVoidType: Necessary for this to work correctly
			  [input?: TParams["_input_in"] | void, opts?: ProcedureOptions]
		  : [input: TParams["_input_in"], opts?: ProcedureOptions];

/**
 *
 * @internal
 */
export interface Procedure<
	TType extends ProcedureType,
	TParams extends ProcedureParams,
> {
	_type: TType;
	_def: TParams & ProcedureBuilderDef<TParams>;
	/**
	 * @deprecated use `._def.meta` instead
	 */
	meta?: TParams["_meta"];
	_procedure: true;
	/**
	 * @internal
	 */
	(opts: ProcedureCallOptions): Promise<unknown>;
}

export type AnyRequestProcedure = Procedure<"request", any>;
export type AnySendProcedure = Procedure<"send", any>;
export type AnyDataStreamProcedure = Procedure<"dataStream", any>;
export type AnyProcedure = Procedure<ProcedureType, any>;
