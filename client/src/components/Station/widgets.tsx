import {
  ComponentPropsWithoutRef,
  ComponentType,
  FC,
  ReactNode,
  useState,
} from "react";
import {RiPictureInPictureLine} from "react-icons/ri";
type IconType = ComponentType<
  ComponentPropsWithoutRef<typeof RiPictureInPictureLine>
>;
export const ClickWidget: FC<{
  icon: IconType;
  onClick: () => void;
  children?: ReactNode;
}> = ({icon: Icon, onClick, children}) => {
  return (
    <button className="widget">
      <Icon onClick={onClick} className="widget-icon h-6 w-6 cursor-pointer" />
      {children}
    </button>
  );
};
export const Widget: FC<{
  icon: IconType;
  component: ComponentType<{close: () => void}>;
}> = ({icon: Icon, component: Component}) => {
  const [open, setOpen] = useState(false);
  return (
    <ClickWidget icon={Icon} onClick={() => setOpen(true)}>
      {open && <Component close={() => setOpen(false)} />}
    </ClickWidget>
  );
};
