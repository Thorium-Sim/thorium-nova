import {useEffect, useReducer} from "react";
import {Icon} from "./Icon";

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
      <Icon name="loader" className="animate-spin-step text-4xl text-white" />
    </div>
  );
};
