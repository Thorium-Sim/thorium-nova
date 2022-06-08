import {useDataStream} from "client/src/context/useDataStream";
import {useNetRequest} from "client/src/context/useNetRequest";

export function Pilot() {
  const ship = useNetRequest("ship");
  const impulseEngines = useNetRequest("impulseEngines");
  useDataStream({systemId: null});

  return (
    <div className="flex flex-col justify-center items-center h-full">
      <h1 className="text-6xl font-bold">Pilot</h1>
      <pre className="flex-1 overflow-y-auto">
        {JSON.stringify(ship, null, 2)}
        {JSON.stringify(impulseEngines, null, 2)}
      </pre>
    </div>
  );
}
