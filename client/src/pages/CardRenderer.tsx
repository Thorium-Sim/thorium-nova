import {q} from "@client/context/AppContext";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {useEffect} from "react";
import {useParams, Navigate} from "react-router-dom";
import StationWrapper from "../components/Station";

export default function CardRenderer() {
  const {component} = useParams() as {component: string};
  const station = q.station.get.useNetRequest();
  const flight = q.flight.active.useNetRequest();
  useEffect(() => {
    q.client.testStation.netSend({component});
    return () => {
      q.client.testStation.netSend({component: null});
    };
  }, [component]);
  if (!flight) return <Navigate to="/" />;
  if (!station) return <LoadingSpinner />;

  return <StationWrapper />;
}
