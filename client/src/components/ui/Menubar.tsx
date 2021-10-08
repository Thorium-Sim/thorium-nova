import {ReactNode} from "react";
import {FaHome} from "react-icons/fa";
import {Link} from "react-router-dom";

export default function Menubar({children}: {children?: ReactNode}) {
  return (
    <div className="py-1 px-4 bg-black/80 border-b border-white/25 flex items-center">
      <Link to="/" className="btn btn-primary btn-xs btn-outline">
        <FaHome className="text-base" />
      </Link>
      {children}
    </div>
  );
}
