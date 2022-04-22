import {useEffect, useReducer} from "react";
import {FaSpinner} from "react-icons/fa";

export const LoadingSpinner = ({compact = false}) => {
  const [show, toggleShow] = useReducer(() => true, false);
  useEffect(() => {
    const timeout = setTimeout(toggleShow, 500);
    return () => clearTimeout(timeout);
  }, []);
  if (!show) return null;
  return (
    <div
      className={`p-4 ${
        compact ? "" : "h-screen"
      } w-full flex justify-center items-center`}
    >
      <FaSpinner className="animate-spin-step text-4xl text-white" />
    </div>
  );
};
