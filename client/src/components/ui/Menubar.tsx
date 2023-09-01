import {useThoriumAccount} from "@client/context/ThoriumAccountContext";
import {
  ReactNode,
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import {FaArrowLeft, FaHome} from "react-icons/fa";
import {Link} from "react-router-dom";
import LoginButton from "../LoginButton";

const MenubarContext = createContext<
  Dispatch<SetStateAction<MenubarContextProps[]>>
>(null!);

type MenubarContextProps = {
  children?: ReactNode;
  backTo?: string;
};
export default function Menubar({children}: {children?: ReactNode}) {
  const {account} = useThoriumAccount();
  const [props, setProps] = useState<MenubarContextProps[]>([]);

  const {backTo, menuChildren} = props.reduce(
    (prev: {backTo?: string; menuChildren?: ReactNode}, curr) => {
      if (curr.backTo) prev.backTo = curr.backTo;
      if (curr.children) prev.menuChildren = curr.children;
      return prev;
    },
    {}
  );
  return (
    <>
      <div className="h-8 px-4 bg-black/80 border-b border-white/25 flex gap-2 items-center">
        <Link to="/" className="btn btn-primary btn-xs btn-outline">
          <FaHome className="text-base" />
        </Link>
        {backTo && (
          <Link to={backTo} className="btn btn-primary btn-xs btn-outline">
            <FaArrowLeft />
          </Link>
        )}
        {menuChildren}
        <div className="flex-1"></div>
        {account && <LoginButton size="sm" />}
      </div>
      <MenubarContext.Provider value={setProps}>
        {children}
      </MenubarContext.Provider>
    </>
  );
}

export function useMenubar(props: MenubarContextProps) {
  const setProps = useContext(MenubarContext);
  if (!setProps)
    throw new Error(
      "useMenubar must be used inside a child of a Menubar component."
    );

  useEffect(() => {
    setProps(oldProps => [...oldProps, props]);
    return () => {
      setProps(oldProps => oldProps.filter(p => p !== props));
    };
  }, [props, setProps]);
}
