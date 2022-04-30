import {Fragment, ReactNode} from "react";
import {Menu, Transition} from "@headlessui/react";
import {HiOutlineChevronDown} from "react-icons/hi";
import Button from "./Button";

function classNames(...classes: (string | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
type Origins =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";
type TriggerProps =
  | {triggerLabel: string; triggerEl?: null}
  | {triggerLabel?: null; triggerEl: ReactNode};

type DropdownProps = TriggerProps & {
  origin?: `origin-${Origins}`;
  children: ReactNode;
};
export default function Dropdown({
  triggerLabel,
  triggerEl,
  origin = "origin-bottom-left",
  children,
}: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left menu-container">
      <div>
        {triggerEl ? (
          triggerEl
        ) : (
          <Menu.Button className="menu-trigger inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
            {triggerLabel}
            <HiOutlineChevronDown
              className="-mr-1 ml-2 h-5 w-5"
              aria-hidden="true"
            />
          </Menu.Button>
        )}
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`z-20 ${origin} absolute ${
            origin.includes("right") ? "right-0" : "left-0"
          } mt-2 w-56 text-base bg-gray-900/90 border-gray-400 border rounded-md shadow-lg max-h-60 ring-1
          ring-black ring-opacity-5 focus:outline-none sm:text-sm overflow-y-auto overflow-x-hidden`}
        >
          <div className="menu-dropdown">{children}</div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

export const DropdownItem = ({
  activeClass = "bg-gray-100 text-gray-900",
  inactiveClass = "text-gray-700",
  className,
  ref,
  ...props
}: {activeClass?: string; inactiveClass?: string} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) => {
  return (
    <Menu.Item>
      {({active}) => (
        <Button
          className={classNames(
            active ? activeClass : inactiveClass,
            "block px-4 py-2 text-sm w-full text-left",
            className
          )}
          {...props}
        ></Button>
      )}
    </Menu.Item>
  );
};
