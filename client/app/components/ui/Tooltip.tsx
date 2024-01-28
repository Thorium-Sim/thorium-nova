import {
  flip,
  offset,
  shift,
  useFloating,
  useInteractions,
  useHover,
  useRole,
  Placement,
} from "@floating-ui/react";
import {Portal} from "@headlessui/react";
import {ReactNode, useState} from "react";

export function Tooltip({
  content,
  children,
  placement = "top",
  ...props
}: {
  content: ReactNode;
  children: ReactNode;
  placement?: Placement;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const {x, y, refs, strategy, context} = useFloating({
    placement,
    middleware: [offset(), flip(), shift()],
    open,
    onOpenChange: setOpen,
  });

  const {getReferenceProps, getFloatingProps} = useInteractions([
    useHover(context),
    useRole(context, {role: "tooltip"}),
  ]);
  return (
    <>
      <div ref={refs.setReference} {...props} {...getReferenceProps()}>
        {children}
      </div>
      {open && (
        <Portal>
          <div
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
            }}
            className="text-white border-white/50 border bg-black/90 py-1 px-2 rounded drop-shadow-xl z-50"
            {...getFloatingProps()}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}
