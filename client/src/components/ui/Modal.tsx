import {Fragment, ReactNode} from "react";
import * as React from "react";
import {Dialog, Transition} from "@headlessui/react";
import {HiX} from "react-icons/hi";
import Button from "./Button";

export default function Modal({
  title,
  isOpen,
  setIsOpen,
  children,
}: {
  title: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  console.log(isOpen);
  return (
    // Use the `Transition` component at the root level
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        onClose={() => setIsOpen(false)}
      >
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block align-bottom bg-gray-900/50 backdrop-filter backdrop-blur text-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 mx-8 md:max-w-max">
              <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                <Button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="sr-only">Close</span>
                  <HiX className="h-6 w-6" aria-hidden="true" />
                </Button>
              </div>
              <Dialog.Title as="h3" className="text-4xl leading-6 font-medium">
                {title}
              </Dialog.Title>
              {children}
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
