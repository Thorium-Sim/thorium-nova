import {animated as a} from "@react-spring/web";
import {useJoystick} from "client/src/hooks/useJoystick";
import {ReactNode} from "react";

export const Joystick = ({
  children,
  className,
  onDrag,
}: {
  onDrag: (dir: {x: number; y: number}) => void;
  className?: string;
  children?: ReactNode;
}) => {
  const [xy, bind, containerRef] = useJoystick({axisSnap: true, onDrag});

  return (
    <div className={`relative aspect-square ${className}`}>
      <div
        ref={containerRef}
        className="top-0 absolute bg-black/50 border-2 border-white/50 rounded-full w-full h-full flex justify-center items-center"
      >
        <a.div
          {...bind()}
          style={{transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`)}}
          className="z-10 w-10 h-10 rounded-full border-black/50 border-2 bg-gray-500 shadow-md cursor-pointer"
        ></a.div>
        {children}
      </div>
    </div>
  );
};

export const LinearJoystick = ({
  className,
  onDrag,
  children,
  vertical,
}: {
  className?: string;
  onDrag: (dirs: {x: number; y: number}) => void;
  children: ReactNode;
  vertical?: boolean;
}) => {
  const [xy, bind, containerRef] = useJoystick({
    axis: vertical ? "y" : "x",
    onDrag,
  });
  return (
    <div
      ref={containerRef}
      className={`${
        vertical ? "h-full" : "w-full"
      } relative bg-black/50 border-2 border-white/50 rounded-full flex justify-center items-center ${className}`}
    >
      <a.div
        {...bind()}
        style={{transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`)}}
        className="z-10 w-10 h-10 rounded-full border-black/50 border-2 bg-gray-500 shadow-md cursor-pointer"
      ></a.div>
      {children}
    </div>
  );
};
