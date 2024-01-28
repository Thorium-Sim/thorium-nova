import {useGetStarmapStore} from "@client/components/Starmap/starmapStore";
import {useEffect} from "react";

export function useCancelFollow() {
  const useStarmapStore = useGetStarmapStore();
  const cameraControls = useStarmapStore(store => store.cameraControls);
  useEffect(() => {
    const cancel = () => {
      useStarmapStore.setState({followEntityId: null});
    };
    const controls = cameraControls?.current;
    controls?.addEventListener("controlstart", cancel);
    return () => {
      controls?.removeEventListener("controlstart", cancel);
    };
  });
}
