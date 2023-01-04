import {
  AnyDataStreamProcedure,
  AnyProcedure,
  AnyRequestProcedure,
  AnySendProcedure,
  ProcedureArgs,
} from "../server/procedure";
import {AnyRouter, ProcedureRouterRecord} from "../server/router";
import {
  inferProcedureInput,
  inferTransformedProcedureOutput,
  MaybePromise,
} from "../server/types";
import {
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";

type Resolver<TProcedure extends AnyProcedure> = (
  ...args: ProcedureArgs<TProcedure["_def"]>
) => Promise<inferTransformedProcedureOutput<TProcedure>>;

type DecorateProcedure<
  TProcedure extends AnyProcedure,
  TPath extends string
> = TProcedure extends AnyRequestProcedure
  ? {
      netRequest: Resolver<TProcedure>;
      useNetRequest: <
        TQueryFnData = inferTransformedProcedureOutput<TProcedure>,
        TData = inferTransformedProcedureOutput<TProcedure>
      >(
        input: inferProcedureInput<TProcedure>,
        opts?: UseQueryOptions<
          TQueryFnData,
          TData,
          Error,
          [TPath, inferProcedureInput<TProcedure>]
        > & {callback?: (data: any) => void}
      ) => [TData, UseQueryResult<TData, Error>];
    }
  : TProcedure extends AnySendProcedure
  ? {
      netSend: Resolver<TProcedure>;
      useNetSend: <TContext = unknown>(
        opts?: UseMutationOptions<
          inferProcedureInput<TProcedure>,
          Error,
          inferTransformedProcedureOutput<TProcedure>,
          TContext
        >
      ) => UseMutationResult<
        inferTransformedProcedureOutput<TProcedure>,
        Error,
        inferProcedureInput<TProcedure>,
        TContext
      >;
    }
  : TProcedure extends AnyDataStreamProcedure
  ? {
      useDataStream: (
        input: inferProcedureInput<TProcedure>
      ) => MaybePromise<void>;
    }
  : never;

/**
 * @internal
 */
export type DecoratedProcedureRecord<
  TProcedures extends ProcedureRouterRecord,
  TPath extends string = ""
> = {
  [TKey in keyof TProcedures]: TProcedures[TKey] extends AnyRouter
    ? DecoratedProcedureRecord<
        TProcedures[TKey]["_def"]["record"],
        `${TPath}${TKey & string}.`
      >
    : TProcedures[TKey] extends AnyProcedure
    ? DecorateProcedure<TProcedures[TKey], `${TPath}${TKey & string}`>
    : never;
};

export type CreateLiveQueryReact<TRouter extends AnyRouter> =
  DecoratedProcedureRecord<TRouter["_def"]["record"]>;
