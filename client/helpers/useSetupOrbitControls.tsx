import {useConfigStore} from "client/components/starmap/configStore";
import {MutableRefObject, useEffect} from "react";
import {useThree} from "react-three-fiber";
import {Vector3} from "three";
import {UseStore} from "zustand";
import {useTranslate2DTo3D} from "./hooks/use2Dto3D";

export function useSetupOrbitControls(
  controls: MutableRefObject<any>,
  store: UseStore<any> = useConfigStore
) {
  const {camera} = useThree();

  const to3D = useTranslate2DTo3D();

  useEffect(() => {
    store.setState({
      translate2dTo3d: to3D,
      disableOrbitControls: () => {
        if (controls.current) {
          controls.current.enabled = false;
        }
      },
      enableOrbitControls: () => {
        if (controls.current) {
          controls.current.enabled = true;
        }
      },
      orbitControlsSet: ({
        zoom,
        position,
      }: {
        zoom?: number;
        position?: Vector3;
      }) => {
        if (controls.current) {
          if (zoom) {
            camera.position.y = zoom;
            if (controls.current.target) {
              camera.position.x = controls.current.target.x;
              camera.position.z = controls.current.target.z;
            }
          }
          if (position) {
            camera.position.x = position.x;
            camera.position.z = position.z;
          }
          controls.current?.target?.set(
            camera.position.x,
            0,
            camera.position.z
          );
          controls.current?.saveState?.();
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, to3D]);
}
