import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Color, type Group } from "three";
import { PlanetSphere } from "@thorium/components/Starmap/Planet";
import Star from "@thorium/components/Starmap/Star/StarMesh";
import { Clouds } from "@thorium/components/Starmap/Planet/Clouds";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { q } from "@thorium/context/AppContext";
import { getNavigationDistance } from "@thorium/utils/starmap/getNavigationDistance";
import { cn } from "@thorium/utils/cn";
import { useStation } from "@thorium/routes/station/useStation";

function getDistanceLabel(input: { distance: number; unit: string } | null) {
	if (!input) return "Unknown";
	return `${input.distance.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})} ${input.unit}`;
}

export const ObjectDetails = () => {
	const useStarmapStore = useGetStarmapStore();
	const selectedObjectIds = useStarmapStore((store) => store.selectedObjectIds);

	return (
		<div className="p-2 panel panel-primary">
			{selectedObjectIds[0] ? (
				<Suspense fallback={<h3 className="text-2xl">Accessing...</h3>}>
					<ObjectData objectId={selectedObjectIds[0]} />
				</Suspense>
			) : (
				<h3 className="text-2xl">No Object Selected</h3>
			)}
		</div>
	);
};

export const ObjectData = ({ objectId }: { objectId: number | string }) => {
	const [object, distanceRef] = useObjectData(objectId);

	if (!object) return null;
	return (
		<div className="flex items-center gap-2">
			<ObjectImage objectImage={object.image} />
			<div>
				<h3 className="text-lg">{object.name}</h3>
				<h4>{object.classification}</h4>
				<h4 className="tabular-nums">
					<strong>Distance:</strong> <span ref={distanceRef} />
				</h4>
			</div>
		</div>
	);
};

export function useObjectData(objectId: number | string) {
	const { shipId } = useStation();
	const [ship] = q.navigation.ship.useNetRequest({ shipId });
	const { interpolate } = useLiveQuery();
	const distanceRef = useRef<HTMLSpanElement>(null);
	const [requestData] = q.navigation.object.useNetRequest({
		objectId: Number(objectId) || undefined,
		shipId,
	});
	const [result] = q.sensors.scanResult.useNetRequest({
		objectId: Number(objectId),
		shipId,
	});
	const object = requestData.object;
	const objectSystem = requestData.objectSystem;
	const shipSystem = requestData.shipSystem;

	useAnimationFrame(() => {
		const objectPosition = interpolate(Number(objectId)) || object?.position;
		if (distanceRef.current && objectPosition) {
			const shipPosition = interpolate(ship.id);
			const distance = getNavigationDistance(
				objectPosition,
				shipPosition,
				objectSystem,
				shipSystem,
			);
			distanceRef.current.innerText = getDistanceLabel(distance);
		}
	});
	return [result.identification, distanceRef] as const;
}

export function ObjectImage({
	objectImage,
	className,
}: {
	objectImage: NonNullable<
		Awaited<
			ReturnType<typeof q.sensors.scanResult.netRequest>
		>["identification"]
	>["image"];
	className?: string;
}) {
	if (!objectImage) return null;
	return objectImage.type === "solarSystem" ? null : (
		<div
			className={cn(
				"w-24 h-24 border border-white/30 rounded-xl overflow-hidden",
				className,
			)}
		>
			<Suspense>
				{objectImage.type === "planet" ? (
					<PlanetCanvas
						cloudMapAsset={objectImage.cloudMapAsset}
						textureMapAsset={objectImage.textureMapAsset}
						ringMapAsset={objectImage.ringMapAsset}
					/>
				) : objectImage.type === "star" ? (
					<StarCanvas
						hue={objectImage.hue || 30}
						isWhite={objectImage.isWhite || false}
					/>
				) : objectImage.type === "ship" ? (
					<img draggable="false" alt="" src={objectImage?.vanity} />
				) : null}
			</Suspense>
		</div>
	);
}

const PlanetGroup = ({
	cloudMapAsset,
	ringMapAsset,
	textureMapAsset,
}: {
	cloudMapAsset?: string | null;
	ringMapAsset?: string | null;
	textureMapAsset: string;
}) => {
	const planetRef = useRef<Group>(null);
	useFrame(() => {
		if (planetRef.current) {
			planetRef.current.rotateY(0.002);
		}
	});
	return (
		<group ref={planetRef}>
			<PlanetSphere texture={textureMapAsset} />
			{/* The ring really does not look goood. */}
			{/* {ringMapAsset && <Rings texture={ringMapAsset} />} */}
			{cloudMapAsset && <Clouds texture={cloudMapAsset} />}
		</group>
	);
};
const PlanetCanvas = ({
	textureMapAsset,
	...props
}: {
	cloudMapAsset?: string | null;
	ringMapAsset?: string | null;
	textureMapAsset?: string | null;
}) => {
	if (!textureMapAsset) return null;
	return (
		<Canvas camera={{ position: [0, 0, 1.8] }}>
			<ambientLight intensity={0.2} />
			<pointLight position={[0, 0.5, 1.5]} intensity={1} />
			<PlanetGroup textureMapAsset={textureMapAsset} {...props} />
		</Canvas>
	);
};

const StarCanvas = ({ hue, isWhite }: { hue: number; isWhite: boolean }) => {
	const color1 = new Color(`hsl(${hue}, 100%, ${isWhite ? 100 : 50}%)`);
	const color2 = new Color(`hsl(${hue + 20}, 100%, ${isWhite ? 100 : 50}%)`);
	return (
		<Canvas camera={{ position: [0, 0, 1.2] }} className="bg-black">
			<Star color1={color1} color2={color2} size={1} noLensFlare showSprite />
		</Canvas>
	);
};
