import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {useEffect} from "react";
import {useParams, Navigate} from "react-router-dom";
import Station from "server/src/classes/Station";
import StationWrapper from "../components/Station";
import {netSend} from "../context/netSend";
import {useNetRequest} from "../context/useNetRequest";

export default function CardRenderer() {
  const {component} = useParams() as {component: string};
  const station = useNetRequest("station");
  const flight = useNetRequest("flight");
  useEffect(() => {
    netSend("clientOverrideStation", {
      station: new Station({
        name: "Test Station",
        cards: [
          {
            name: component,
            component,
          },
        ],
      }),
    });
    return () => {
      netSend("clientOverrideStation", {});
    };
  }, [component]);
  if (!flight) return <Navigate to="/" />;
  if (!station) return <LoadingSpinner />;

  return <StationWrapper />;
}
