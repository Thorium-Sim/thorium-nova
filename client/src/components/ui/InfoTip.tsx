import {Popover, Transition} from "@headlessui/react";
import {ReactNode} from "react";
import {FaInfoCircle} from "react-icons/fa";
import Button from "./Button";

const InfoTip = ({children}: {children: ReactNode}) => {
  return (
    <Popover className="relative">
      <Popover.Button>
        <Button className="btn btn-ghost btn-xs p-0">
          <FaInfoCircle className="inline-block text-primary text-base cursor-pointer" />
        </Button>
      </Popover.Button>
      <Transition
        className="origin-center"
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <Popover.Panel
          className={`absolute bottom-8 max-w-xs z-10 border-transparent shadow-lg bg-opacity-90 bg-black rounded-lg p-2`}
        >
          {children}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
export default InfoTip;
