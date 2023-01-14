import {Fragment, ReactElement, ReactNode, useState} from "react";
import {Combobox, Transition} from "@headlessui/react";
import {HiCheck, HiSelector} from "react-icons/hi";
import {QueryFunctionContext, useQuery} from "@tanstack/react-query";
import {LoadingSpinner} from "./LoadingSpinner";

export function DefaultResultLabel({
  children,
  selected,
  active,
}: {
  children: ReactNode;
  selected: boolean;
  active: boolean;
}) {
  return (
    <>
      <span
        className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
      >
        {children}
      </span>
      {selected ? (
        <span
          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
            active ? "text-white" : "text-teal-600"
          }`}
        >
          <HiCheck className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );
}

export default function SearchableInput<T extends {id: any}>({
  getOptions,
  ResultLabel,
  displayValue = item => item?.id,
  queryKey = "searchableInput",
  selected,
  setSelected,
  placeholder,
  inputClassName,
}: {
  queryKey?: string;
  displayValue?: (item: T) => string;
  ResultLabel: (props: {
    result: T;
    selected: boolean;
    disabled: boolean;
    active: boolean;
  }) => ReactElement;
  getOptions: (
    queryOptions: QueryFunctionContext<[string, string]>
  ) => Promise<T[]>;
  selected?: T | null;
  setSelected?: (item: T | null) => void;
  placeholder?: string;
  inputClassName?: string;
}) {
  const [query, setQuery] = useState("");

  const searchQuery = useQuery({
    queryKey: [queryKey, query],
    queryFn: getOptions,
    suspense: false,
    enabled: query.length > 0,
    keepPreviousData: true,
  });

  return (
    <Combobox value={selected} onChange={setSelected || (() => {})}>
      <div className="relative mt-1">
        <div className="relative w-full cursor-default overflow-hidden rounded-lg text-left focus:outline-none sm:text-sm">
          <Combobox.Input
            className={`input w-full pointer-events-auto ${
              inputClassName || ""
            }`}
            displayValue={displayValue}
            defaultValue={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <Combobox.Button className="absolute pointer-events-auto inset-y-0 right-0 flex items-center pr-2">
            <HiSelector className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => {
            setQuery("");
          }}
        >
          <Combobox.Options className="absolute pointer-events-auto mt-1 max-h-60 w-full overflow-auto panel !bg-black/90 z-40">
            {searchQuery.isLoading && searchQuery.isFetching && (
              <div className="relative cursor-default select-none py-2 px-4">
                <LoadingSpinner compact />
              </div>
            )}
            {searchQuery.data?.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none py-2 px-4">
                Nothing found.
              </div>
            ) : (
              searchQuery.data?.map(result => (
                <Combobox.Option
                  key={result.id}
                  className={({active}) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-primary text-white" : "text-gray-200"
                    }`
                  }
                  value={result}
                >
                  {({active, disabled, selected}) => (
                    <ResultLabel
                      result={result}
                      active={active}
                      disabled={disabled}
                      selected={selected}
                    />
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}
