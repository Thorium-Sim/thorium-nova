import { createRecursiveProxy } from "../proxy";
import type {
	AnyProcedure,
	ProcedureArgs,
	ProcedureCallOptions,
} from "./procedure";
import {
	type AnyRootConfig,
	type ProcedureType,
	procedureTypes,
} from "./types";

/** @internal **/
export type ProcedureRecord = Record<string, AnyProcedure>;

export interface ProcedureRouterRecord {
	[key: string]: AnyProcedure | AnyRouter;
}

export type AnyRouterDef<TConfig extends AnyRootConfig = AnyRootConfig> =
	RouterDef<TConfig, any>;

type DecorateProcedure<TProcedure extends AnyProcedure> = (
	input: ProcedureArgs<TProcedure["_def"]>[0],
) => Promise<TProcedure["_def"]["_output_out"]>;

/**
 * @internal
 */
type DecoratedProcedureRecord<TProcedures extends ProcedureRouterRecord> = {
	[TKey in keyof TProcedures]: TProcedures[TKey] extends AnyRouter
		? DecoratedProcedureRecord<TProcedures[TKey]["_def"]["record"]>
		: TProcedures[TKey] extends AnyProcedure
		  ? DecorateProcedure<TProcedures[TKey]>
		  : never;
};

/**
 * @internal
 */
export type RouterCaller<TDef extends AnyRouterDef> = (
	ctx: TDef["_config"]["$types"]["ctx"],
) => DecoratedProcedureRecord<TDef["record"]>;

export interface Router<TDef extends AnyRouterDef> {
	_def: TDef;
	createCaller: RouterCaller<TDef>;
}

export type AnyRouter = Router<AnyRouterDef>;

export interface RouterDef<
	TConfig extends AnyRootConfig,
	TRecord extends ProcedureRouterRecord,
> {
	_config: TConfig;
	router: true;
	procedures: TRecord;
	record: TRecord;
}

/**
 * Create an object without inheriting anything from `Object.prototype`
 * @internal
 */
export function omitPrototype<TObj extends Record<string, unknown>>(
	obj: TObj,
): TObj {
	return Object.assign(Object.create(null), obj);
}

/**
 * Reserved words that can't be used as router or procedure names
 */
const reservedWords = [
	/**
	 * Then is a reserved word because otherwise we can't return a promise that returns a Proxy
	 * since JS will think that `.then` is something that exists
	 */
	"then",
];

/**
 * @internal
 */
export type CreateRouterInner<
	TConfig extends AnyRootConfig,
	TProcRouterRecord extends ProcedureRouterRecord,
> = Router<RouterDef<TConfig, TProcRouterRecord>> & TProcRouterRecord;

function isRouter(
	procedureOrRouter: AnyProcedure | AnyRouter,
): procedureOrRouter is AnyRouter {
	return "router" in procedureOrRouter._def;
}

const emptyRouter = {
	_ctx: null as any,
	_errorShape: null as any,
	_meta: null as any,
	_entity: null as any,
};

/**
 * @internal
 */
export function createRouterFactory<TConfig extends AnyRootConfig>(
	config: TConfig,
) {
	return function createRouterInner<
		TProcRouterRecord extends ProcedureRouterRecord,
	>(
		procedures: TProcRouterRecord,
	): CreateRouterInner<TConfig, TProcRouterRecord> {
		const reservedWordsUsed = new Set(
			Object.keys(procedures).filter((v) => reservedWords.includes(v)),
		);
		if (reservedWordsUsed.size > 0) {
			throw new Error(
				`Reserved words used in \`router({})\` call: ${Array.from(
					reservedWordsUsed,
				).join(", ")}`,
			);
		}

		const routerProcedures: ProcedureRecord = omitPrototype({});
		function recursiveGetPaths(procedures: ProcedureRouterRecord, path = "") {
			for (const [key, procedureOrRouter] of Object.entries(procedures ?? {})) {
				const newPath = `${path}${key}`;

				if (isRouter(procedureOrRouter)) {
					recursiveGetPaths(procedureOrRouter._def.procedures, `${newPath}.`);
					continue;
				}

				if (routerProcedures[newPath]) {
					throw new Error(`Duplicate key: ${newPath}`);
				}

				routerProcedures[newPath] = procedureOrRouter;
			}
		}
		recursiveGetPaths(procedures);

		const _def: AnyRouterDef<TConfig> = {
			_config: config,
			router: true,
			procedures: routerProcedures,
			...emptyRouter,
			record: procedures,
		};

		const router: AnyRouter = {
			...procedures,
			_def,
			createCaller(ctx) {
				const proxy = createRecursiveProxy(({ path, args }) => {
					// interop mode
					if (
						path.length === 1 &&
						procedureTypes.includes(path[0] as ProcedureType)
					) {
						return callProcedure({
							procedures: _def.procedures,
							path: args[0] as string,
							rawInput: args[1],
							ctx,
							type: path[0] as ProcedureType,
						});
					}

					const fullPath = path.join(".");
					const procedure = _def.procedures[fullPath] as AnyProcedure;

					let type: ProcedureType = "request";
					if (procedure._def.input) {
						type = "send";
					} else if (procedure._def.dataStream) {
						type = "dataStream";
					}

					return procedure({
						path: fullPath,
						rawInput: args[0],
						ctx,
						type,
					});
				});

				return proxy as ReturnType<RouterCaller<any>>;
			},
		};
		return router as any;
	};
}

/**
 * @internal
 */
export async function callProcedure(
	opts: ProcedureCallOptions & { procedures: ProcedureRouterRecord },
) {
	const { type, path, onCall } = opts;

	if (!(path in opts.procedures) || !opts.procedures[path]?._def[type]) {
		throw new Error(`No "${type}"-procedure on path "${path}"`);
	}

	const { procedures, ...procedureOpts } = opts;
	const procedure = procedures[path] as AnyProcedure;
	const result = await procedure(opts);
	onCall?.(procedureOpts);
	return result;
}
