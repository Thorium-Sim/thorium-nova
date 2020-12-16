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

export const Thrusters = () => {
  const [direction] = useThrustersSetDirectionMutation();
  const [rotation] = useThrustersSetRotationDeltaMutation();
  const {t} = useTranslation();
  return (
    <div
      className="relative grid grid-flow-col gap-4"
      css={css`
        grid-template-columns: calc(2.5rem + 4px) 1fr;
        grid-template-rows: auto calc(2.5rem + 4px) calc(2.5rem + 4px) 1fr;
      `}
    >
      <div></div>
      <div></div>
      <div></div>

      <DirectionSlider />
      <div>
        <Joystick onDrag={({x, y}) => rotation({variables: {z: x, x: y}})}>
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
      </div>
      <YawSlider />
      <div></div>
      <div>
        <Joystick onDrag={({x, y}) => direction({variables: {y: -y, x: -x}})}>
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
      </div>
    </div>
  );
};
const Joystick: FC<{onDrag: (dir: {x: number; y: number}) => void}> = ({
  children,
  onDrag,
}) => {
  const [xy, bind, containerRef] = useJoystick({axisSnap: true, onDrag});

  return (
    <div className="relative">
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
const YawSlider = () => {
  const [rotation] = useThrustersSetRotationDeltaMutation();
  const {t} = useTranslation();

  const [xy, bind, containerRef] = useJoystick({
    axis: "x",
    onDrag: ({x, y}) => rotation({variables: {y: -x}}),
  });
  return (
    <div
      ref={containerRef}
      className="w-full relative bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded-full flex justify-center items-center"
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
const DirectionSlider = () => {
  const [direction] = useThrustersSetDirectionMutation();
  const [xy, bind, containerRef] = useJoystick({
    axis: "y",
    onDrag: ({x, y}) => direction({variables: {z: -y}}),
  });
  const {t} = useTranslation();

  return (
    <div
      ref={containerRef}
      className="h-full relative bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded-full flex justify-center items-center"
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
