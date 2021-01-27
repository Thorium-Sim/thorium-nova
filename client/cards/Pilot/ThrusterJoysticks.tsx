import {css} from "@emotion/core";
import {
  useThrustersSetDirectionMutation,
  useThrustersSetRotationDeltaMutation,
} from "client/generated/graphql";
import {useJoystick} from "client/helpers/hooks/useJoystick";
import {Spacer} from "client/helpers/spacer";
import {FC} from "react";
import {useTranslation} from "react-i18next";
import {animated as a} from "react-spring/web";

export const Thrusters: FC = ({children}) => {
  const [direction] = useThrustersSetDirectionMutation();
  const [rotation] = useThrustersSetRotationDeltaMutation();
  const {t} = useTranslation();
  return (
    <div
      className="relative grid grid-flow-col gap-4"
      css={css`
        grid-template-columns: 1fr calc(2.5rem + 4px) 8fr;
        grid-template-rows: auto calc(2.5rem + 4px) auto 1fr;
        grid-template-areas:
          "nothing1 nothing1 rotation"
          "nothing1 nothing1 yaw"
          "nothing2 forward direction"
          "nothing2 control control";
      `}
    >
      <Joystick
        onDrag={({x, y}) => rotation({variables: {z: x, x: y}})}
        css={css`
          grid-area: rotation;
        `}
      >
        <p className="select-none pointer-events-none absolute bottom-1">
          {t("Pitch Down")}
        </p>
        <p className="select-none pointer-events-none absolute top-1">
          {t("Pitch Up")}
        </p>
        <p className="select-none pointer-events-none absolute right-1">
          {t("Starboard Roll")}
        </p>
        <p className="select-none pointer-events-none absolute left-1">
          {t("Port Roll")}
        </p>
      </Joystick>
      <YawSlider
        css={css`
          grid-area: yaw;
        `}
      />
      <Joystick
        onDrag={({x, y}) => direction({variables: {y: -y, x: -x}})}
        css={css`
          grid-area: direction;
        `}
      >
        <p className="select-none pointer-events-none absolute bottom-1">
          {t("Down")}
        </p>
        <p className="select-none pointer-events-none absolute top-1">
          {t("Up")}
        </p>
        <p className="select-none pointer-events-none absolute right-1">
          {t("Starboard")}
        </p>
        <p className="select-none pointer-events-none absolute left-1">
          {t("Port")}
        </p>
      </Joystick>
      <DirectionSlider
        css={css`
          grid-area: forward;
        `}
      />
      <div
        css={css`
          grid-area: control;
        `}
      >
        {children}
      </div>
    </div>
  );
};
const Joystick: FC<{
  onDrag: (dir: {x: number; y: number}) => void;
  className?: string;
}> = ({children, className, onDrag}) => {
  const [xy, bind, containerRef] = useJoystick({axisSnap: true, onDrag});

  return (
    <div className={`relative ${className}`}>
      <Spacer fillWidth />
      <div
        ref={containerRef}
        className="top-0 absolute bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded-full w-full h-full flex justify-center items-center"
      >
        <a.div
          {...bind()}
          style={{transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`)}}
          className="z-10 w-10 h-10 rounded-full border-blackAlpha-500 border-2 bg-gray-500 shadow-md cursor-pointer"
        ></a.div>
        {children}
      </div>
    </div>
  );
};
const YawSlider = ({className}: {className?: string}) => {
  const [rotation] = useThrustersSetRotationDeltaMutation();
  const {t} = useTranslation();

  const [xy, bind, containerRef] = useJoystick({
    axis: "x",
    onDrag: ({x, y}) => rotation({variables: {y: -x}}),
  });
  return (
    <div
      ref={containerRef}
      className={`w-full relative bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded-full flex justify-center items-center ${className}`}
    >
      <a.div
        {...bind()}
        style={{transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`)}}
        className="z-10 w-10 h-10 rounded-full border-blackAlpha-500 border-2 bg-gray-500 shadow-md cursor-pointer"
      ></a.div>
      <p className="select-none pointer-events-none absolute left-1">
        {t("Port Yaw")}
      </p>
      <p className="select-none pointer-events-none absolute right-1">
        {t("Starboard Yaw")}
      </p>
    </div>
  );
};
const DirectionSlider = ({className}: {className?: string}) => {
  const [direction] = useThrustersSetDirectionMutation();
  const [xy, bind, containerRef] = useJoystick({
    axis: "y",
    onDrag: ({x, y}) => direction({variables: {z: -y}}),
  });
  const {t} = useTranslation();

  return (
    <div
      ref={containerRef}
      className={`h-full relative bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded-full flex justify-center items-center ${className}`}
    >
      <a.div
        {...bind()}
        style={{transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`)}}
        className="z-10 w-10 h-10 rounded-full border-blackAlpha-500 border-2 bg-gray-500 shadow-md cursor-pointer"
      ></a.div>
      <p className="select-none pointer-events-none absolute top-1">
        {t("Fore")}
      </p>
      <p className="select-none pointer-events-none absolute bottom-1">
        {t("Aft")}
      </p>
    </div>
  );
};
