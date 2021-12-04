import {useClientData} from "client/src/context/useCardData";
import {Navigate} from "react-router-dom";
import {Effects} from "./Effects";
import StationLayout from "./StationLayout";

const StationWrapper = () => {
  const {client, station} = useClientData();
  // TODO November 29, 2021: Include sound player here
  // TODO November 29, 2021: Include some kind of alert toast notification thing here
  // The existing alerts won't be targeted by the theme, so we need to embed it here.
  if (!station) return <Navigate to="/" />;
  return (
    <div className="bg-black absolute z-1 h-full w-full top-0 bottom-">
      {client.offlineState !== "blackout" && (
        <>
          <Effects />
          <StationLayout />
        </>
      )}
    </div>
  );
};

export default StationWrapper;
