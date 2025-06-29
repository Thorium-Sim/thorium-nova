import { InterstellarMap } from "@thorium/components/Starmap/InterstellarMap";
import SystemMarker from "@thorium/components/Starmap/SystemMarker";
import { q } from "@thorium/context/AppContext";
import { useParams } from "react-router";

export default function InterstellarWrapper({
	draggable = true,
	onDoubleClick,
	children,
}: {
	draggable?: boolean;
	onDoubleClick?: (systemId: string) => void;
	children?: React.ReactNode;
}) {
	const { pluginId } = useParams() as {
		pluginId: string;
	};

	const [stars] = q.plugin.starmap.all.useNetRequest({ pluginId });
	return (
		<InterstellarMap>
			{stars.map((star) => (
				<SystemMarker
					key={star.name}
					systemId={star.name}
					position={Object.values(star.position) as [number, number, number]}
					name={star.name}
					draggable={draggable}
					onDoubleClick={() => onDoubleClick?.(star.name)}
				/>
			))}
			{children}
		</InterstellarMap>
	);
}
