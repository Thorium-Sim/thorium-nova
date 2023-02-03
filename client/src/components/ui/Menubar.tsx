import {useThoriumAccount} from "@client/context/ThoriumAccountContext";
import {ReactNode} from "react";
import {FaArrowLeft, FaHome} from "react-icons/fa";
import {Link} from "react-router-dom";
import LoginButton from "../LoginButton";

export default function Menubar({
  children,
  backTo,
}: {
  children?: ReactNode;
  backTo?: string;
}) {
  const {account} = useThoriumAccount();

  return (
    <div className="h-8 px-4 bg-black/80 border-b border-white/25 flex gap-2 items-center">
      <Link to="/" className="btn btn-primary btn-xs btn-outline">
        <FaHome className="text-base" />
      </Link>
      {backTo && (
        <Link to={backTo} className="btn btn-primary btn-xs btn-outline">
          <FaArrowLeft />
        </Link>
      )}
      {children}
      <div className="flex-1"></div>
      {account && <LoginButton size="sm" />}
    </div>
  );
}
