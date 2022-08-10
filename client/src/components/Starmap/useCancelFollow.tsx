import {useGetStarmapStore} from "client/src/components/Starmap/starmapStore";
import {useEffect} from "react";

export function useCancelFollow() {
  const useStarmapStore = useGetStarmapStore();
  const cameraControls = useStarmapStore(store => store.cameraControls);
  useEffect(() => {
    const cancel = () => {
      useStarmapStore.setState({followEntityId: null});
    };
    cameraControls?.current?.addEventListener("controlstart", cancel);
    return () => {
      cameraControls?.current?.removeEventListener("controlstart", cancel);
    };
  });
}
