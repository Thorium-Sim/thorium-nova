import React from "react";

const Badge: React.FC<React.HTMLAttributes<HTMLDivElement>> = props => {
  return (
    <div
      {...props}
      className={`${
        props.className || ""
      }  px-1 uppercase text-xs font-bold whitespace-no-wrap bg-whiteAlpha-50`}
    ></div>
  );
};

export default Badge;
