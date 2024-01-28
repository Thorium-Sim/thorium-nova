import {useParams} from "@remix-run/react";
import {useMenubar} from "@thorium/ui/Menubar";

export default function ShipList() {
  const {pluginId} = useParams() as {pluginId: string};

  useMenubar({backTo: `/config/${pluginId}/list`});
  return <div className="h-full"></div>;
}
