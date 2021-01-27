import {FC} from "react";

export const Card: FC<{centered?: boolean; className?: string}> = ({
  centered,
  className,
  children,
}) => {
  return (
    <div
      className={`ui-card text-xl w-full px-4 py-2 ${
        centered ? "text-center" : ""
      } bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded ${className}`}
    >
      {children}
    </div>
  );
};
