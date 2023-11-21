import * as Cards from "client/src/cards";
import {q} from "@client/context/AppContext";
import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {
  ComponentPropsWithoutRef,
  ComponentType,
  FC,
  ReactElement,
  ReactNode,
  useState,
} from "react";
import {RiLogoutCircleRLine, RiPictureInPictureLine} from "react-icons/ri";
import {GamepadConfig, useGamepadStore} from "@client/hooks/useGamepadStore";
import {BsJoystick} from "react-icons/bs";
import {Popover, Transition} from "@headlessui/react";
import {
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react-dom-interactions";

type IconType =
  | ComponentType<ComponentPropsWithoutRef<typeof RiPictureInPictureLine>>
  | ReactElement;

export const Widgets = () => {
  const [station] = q.station.get.useNetRequest();

  return (
    <>
      {/* <Widget icon={RiPictureInPictureLine} component={ViewscreenWidget} /> */}
      {station.widgets?.map(widget => {
        const WidgetComp = Cards[widget.component as keyof typeof Cards];
        if (!widget.icon) return null;
        return (
          <Widget
            name={widget.name}
            key={widget.component}
            icon={
              <SVGImageLoader
                className="widget-icon w-6 h-6 cursor-pointer"
                url={widget.icon}
              />
            }
            component={WidgetComp}
          />
        );
      })}
      <GamepadWidget />
      <ClickWidget
        icon={RiLogoutCircleRLine}
        onClick={() => q.client.logout.netSend()}
      />
    </>
  );
};

export const ClickWidget: FC<{
  icon: IconType;
  onClick: () => void;
  children?: ReactNode;
}> = ({icon: Icon, onClick, children}) => {
  return (
    <button className="widget" onClick={onClick}>
      {"type" in Icon ? (
        Icon
      ) : (
        <Icon className="widget-icon h-6 w-6 cursor-pointer" />
      )}
      {children}
    </button>
  );
};
export const Widget: FC<{
  name: string;
  icon: IconType;
  component: ComponentType<{
    cardLoaded: boolean;
    isOpen: boolean;
    onClose: () => void;
  }>;
}> = ({name, icon: Icon, component: Component}) => {
  const [isOpen, setIsOpen] = useState(false);

  const {x, y, strategy, reference, floating, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "top-end",
  });

  const dismiss = useDismiss(context);

  const click = useClick(context);

  const {getReferenceProps, getFloatingProps} = useInteractions([
    click,
    dismiss,
  ]);

  return (
    <Popover className="relative">
      <Popover.Button
        className="widget"
        ref={reference}
        {...getReferenceProps()}
      >
        {"type" in Icon ? (
          Icon
        ) : (
          <Icon className="widget-icon h-6 w-6 cursor-pointer" />
        )}
      </Popover.Button>
      <Transition
        className="relative z-40"
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <Popover.Panel
          className="absolute isolate right-0 z-50 bg-black/90 border border-white/50 rounded p-2 w-max max-w-lg"
          ref={floating}
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
          }}
          {...getFloatingProps()}
        >
          <Component
            cardLoaded={isOpen}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

function GamepadWidget() {
  const [configOpen, setConfigOpen] = useState(false);
  const hasGamepad = useGamepadStore(
    store => store.gamepads.filter(Boolean).length > 0
  );
  if (!hasGamepad) return null;
  return (
    <>
      <ClickWidget icon={BsJoystick} onClick={() => setConfigOpen(true)} />
      <GamepadConfig
        isOpen={configOpen}
        setIsOpen={() => setConfigOpen(false)}
      />
    </>
  );
}
