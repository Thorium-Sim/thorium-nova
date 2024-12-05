import { useParams } from "@remix-run/react";
import { useMenubar } from "@thorium/ui/Menubar";

export default function ShipList() {
	const { pluginId } = useParams() as { pluginId: string };

	return <div className="h-full" />;
}
