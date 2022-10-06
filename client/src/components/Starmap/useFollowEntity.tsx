import {useFrame, useThree} from "@react-three/fiber";
import {useThorium} from "client/src/context/ThoriumContext";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useEffect} from "react";
import {useGetStarmapStore} from "./starmapStore";

export function useFollowEntity(topDown = true) {
  const useStarmapStore = useGetStarmapStore();
  
  const cameraControls = useStarmapStore(store => store.cameraControls);
  const followEntityId = useStarmapStore(store => store.followEntityId);

  const starmapShip = useNetRequest("starmapShip", {shipId: followEntityId});

  const systemId = starmapShip?.systemId;
  useEffect(() => {
    if (starmapShip?.id) {
      useStarmapStore.getState().setCurrentSystem(systemId || null);
    }
  }, [starmapShip?.id, systemId, useStarmapStore]);

  const {interpolate} = useThorium();
  useFrame(() => {
    if (!followEntityId) return;
    const position = interpolate(followEntityId);
    if (!position) return;
    cameraControls?.current?.moveTo(
      position.x,
      topDown ? 0 : position.y,
      position.z,
      false
    );
    // TODO July 30, 2022: Also make the camera point in the direction of the entity. Useful for the viewscreen
  });
}
