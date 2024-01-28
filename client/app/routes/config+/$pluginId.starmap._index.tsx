import {InterstellarMap} from "@client/components/Starmap/InterstellarMap";
import SystemMarker from "@client/components/Starmap/SystemMarker";
import {q} from "@client/context/AppContext";
import {useParams} from "@remix-run/react";

export default function InterstellarWrapper() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };

  const [stars] = q.plugin.starmap.all.useNetRequest({pluginId});
  return (
    <InterstellarMap>
      {stars.map(star => (
        <SystemMarker
          key={star.name}
          systemId={star.name}
          position={Object.values(star.position) as [number, number, number]}
          name={star.name}
          draggable
        />
      ))}
    </InterstellarMap>
  );
}
