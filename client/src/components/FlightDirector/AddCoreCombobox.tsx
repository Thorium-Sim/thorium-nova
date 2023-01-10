import {Fragment, useState} from "react";
import {Combobox, Transition} from "@headlessui/react";
import {HiSelector} from "react-icons/hi";
import * as Cores from "../../cores";

export const coreNames = Object.keys(Cores);

export function AddCoreCombobox({
  onChange,
}: {
  onChange: (coreName: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filteredCores = coreNames.filter(name =>
    name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Combobox value={""} onChange={onChange}>
      <div className="relative">
        <div className="cursor-pointer min-h-6 h-6 leading-5 relative border-success border rounded-lg">
          <Combobox.Input
            placeholder="Add Core"
            className="w-full bg-transparent placeholder:text-success placeholder:font-semibold text-success border-none outline-none focus:ring-0 pl-3 pr-10 text-xs leading-5"
            // displayValue={coreName => coreName}
            onChange={event => setQuery(event.target.value)}
          />
          <Combobox.Button className="absolute w-10 bg-success/20 hover:bg-success/50 cursor-pointer rounded inset-y-0 right-0 flex items-center justify-center">
            <HiSelector className="w-5 h-5 text-success" aria-hidden="true" />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options className="absolute w-full mt-1 overflow-auto text-base bg-gray-900/90 border-gray-400 border rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
            {filteredCores.length === 0 && query !== "" ? (
              <div className="cursor-default select-none relative py-1 px-1 text-gray-300">
                Nothing found.
              </div>
            ) : (
              filteredCores.map(coreName => (
                <Combobox.Option
                  key={coreName}
                  className={({active}) =>
                    `cursor-default select-none relative py-1 px-2 ${
                      active ? "text-white bg-success" : ""
                    }`
                  }
                  value={coreName}
                >
                  <span className={`block truncate font-normal`}>
                    {coreName.replace("Core", "")}
                  </span>
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}
