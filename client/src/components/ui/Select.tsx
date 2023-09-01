import {Dispatch, Fragment, SetStateAction, useState} from "react";
import {Listbox, Transition} from "@headlessui/react";
import {HiSelector, HiCheck} from "react-icons/hi";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Select<
  I extends string | number,
  T extends {id: I; label: string}
>({
  label,
  labelHidden,
  disabled,
  items,
  selected,
  setSelected,
  size = "md",
  className,
  placeholder,
}: {
  label: string;
  labelHidden?: boolean;
  disabled?: boolean;
  items: T[];
  selected: T | null;
  setSelected: (value: T) => void;
  size?: "xs" | "sm" | "md";
  className?: string;
  placeholder?: string;
}) {
  return (
    <Listbox value={selected} onChange={setSelected} disabled={disabled}>
      {({open}) => (
        <>
          <Listbox.Label
            className={classNames(
              "select-label block text-sm font-medium text-gray-200",
              labelHidden ? "sr-only" : ""
            )}
          >
            {label}
          </Listbox.Label>
          <div className={classNames(labelHidden ? "" : "mt-1", "relative")}>
            <Listbox.Button
              className={classNames(
                size === "xs"
                  ? "select-xs py-0"
                  : size === "sm"
                  ? "select-sm py-1"
                  : "py-2",
                "select-button bg-gray-900 text-gray-100 relative w-full border border-gray-700 rounded-md shadow-sm pl-3 pr-10 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
                className || ""
              )}
            >
              <span className="block truncate">
                {selected ? selected.label : placeholder || "Choose One"}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <HiSelector
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="select-options isolate min-w-fit absolute z-10 mt-1 w-full bg-gray-900 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-gray-400 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {items.map(item => (
                  <Listbox.Option
                    key={item.id}
                    className={({active}) =>
                      classNames(
                        active ? "text-white bg-blue-600" : "text-gray-100",
                        "cursor-default select-none relative py-2 pl-3 pr-9 min-w-fit"
                      )
                    }
                    value={item}
                    title={item.label}
                  >
                    {({selected, active}) => (
                      <>
                        <span
                          className={classNames(
                            selected ? "font-semibold" : "font-normal",
                            "block truncate"
                          )}
                        >
                          {item.label}
                        </span>

                        {selected ? (
                          <span
                            className={classNames(
                              active ? "text-white" : "text-blue-600",
                              "absolute inset-y-0 right-0 flex items-center pr-4"
                            )}
                          >
                            <HiCheck className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
