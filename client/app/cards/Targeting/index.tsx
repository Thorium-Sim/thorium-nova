import * as React from "react";
import {
	CircleGrid,
	CircleGridTiltButton,
	GridCanvas,
} from "../Pilot/CircleGrid";
import type { CardProps } from "@client/routes/flight.station/CardProps";
import { CircleGridStoreProvider } from "../Pilot/useCircleGridStore";
import { PilotZoomSlider } from "../Pilot/PilotZoomSlider";
import { CircleGridContacts } from "../Pilot/PilotContacts";
import { q } from "@client/context/AppContext";
import { ObjectImage, useObjectData } from "../Navigation/ObjectDetails";
import { cn } from "@client/utils/cn";
import LauncherImage from "./assets/launcher.svg";
import href from "./assets/torpedoSprite.svg?url";
import Button from "@thorium/ui/Button";
import { degToRad, megaWattHourToGigaJoule } from "@server/utils/unitTypes";
import type { ShieldDirections } from "@server/classes/Plugins/ShipSystems/Shields";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import { useLiveQuery } from "@thorium/live-query/client";
import chroma from "chroma-js";
import { DoubleSide, Euler, type Group, Quaternion, Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { Edges, Line } from "@react-three/drei";
import type { Line2 } from "three-stdlib";
import { Icon } from "@thorium/ui/Icon";
import { Tooltip } from "@thorium/ui/Tooltip";
import Slider from "@thorium/ui/Slider";
import { useQueryClient } from "@tanstack/react-query";
import { isPointWithinCone } from "@server/utils/isPointWithinCone";
/**
 * TODO:
 * Add overlays to the targeting grid showing where the torpedo will fire from
 * Add explosions to the Viewscreen, and maybe even the targeting grid.
 */
export function Targeting({ cardLoaded }: CardProps) {
	const setTarget = q.targeting.setTarget.useNetSend();
	const [targetedContact] = q.targeting.targetedContact.useNetRequest();
	const clickRef = React.useRef(false);
	q.targeting.stream.useDataStream();
	const [hull] = q.targeting.hull.useNetRequest();
	return (
		<CircleGridStoreProvider zoomMax={25000}>
			<div className="grid grid-cols-4 h-full place-content-center gap-4">
				{/* Padding is rotection from the bottom of the card container */}
				<div className="flex flex-col justify-between pb-4">
					<Shields cardLoaded={cardLoaded} />
					<div>Hull: {hull}</div>
					<Phasers />
				</div>
				<div className="col-span-2 w-full aspect-square self-center">
					<React.Suspense fallback={null}>
						<GridCanvas
							shouldRender={cardLoaded}
							onBackgroundClick={() => {
								if (clickRef.current === true) {
									clickRef.current = false;
									return;
								}
								if (targetedContact) {
									setTarget.mutate({ target: null });
								}
							}}
						>
							<CircleGrid
								fixedChildren={
									<>
										<PhaserArcs />
									</>
								}
							>
								<BeamVisualization />
								<CircleGridContacts
									onContactClick={(contact) => {
										clickRef.current = true;
										setTarget.mutate({ target: contact });
									}}
								/>
							</CircleGrid>
						</GridCanvas>
					</React.Suspense>
				</div>
				<div className="h-full flex flex-col gap-2 overflow-y-hidden">
					<Torpedoes />
					<div
						className={cn(
							"panel",
							targetedContact ? "panel-error" : "panel-primary",
						)}
					>
						{targetedContact?.id ? (
							<React.Suspense
								fallback={<h3 className="text-2xl">Accessing...</h3>}
							>
								<ObjectData objectId={targetedContact.id} />
							</React.Suspense>
						) : (
							<h3 className="text-2xl p-2 text-center">No Object Targeted</h3>
						)}
					</div>
					<div>
						<PilotZoomSlider />
						<CircleGridTiltButton />
					</div>
				</div>
			</div>
		</CircleGridStoreProvider>
	);
}

const shieldColors = [
	"oklch(10.86% 0.045 29.25)", // Black
	"oklch(66.33% 0.2823 29.25)", // Red
	"oklch(76.18% 0.207 56.11)", // Orange
	"oklch(86.52% 0.204 90.38", // Yellow
	"oklch(86.18% 0.343 142.58)", // Green
	"oklch(57.65% 0.249 256.24)", // Blue
];
const shieldColor = (integrity: number) => {
	// @ts-expect-error chroma types are wrong - it does support oklch
	return chroma.scale(shieldColors).mode("oklch")(integrity).css("oklch");
};
const shieldStyle = (
	shields: {
		strength: number;
		maxStrength: number;
		direction: "fore" | "aft" | "starboard" | "port" | "dorsal" | "ventral";
	}[],
	extra = false,
) => {
	// Creates the styles for multiple shields
	const output: string[] = [];
	shields.forEach((s) => {
		const integrity = s.strength / s.maxStrength;
		const color = shieldColor(integrity);
		if (
			(s.direction === "starboard" && !extra) ||
			(s.direction === "fore" && extra)
		) {
			output.push(`20px 0px 20px -15px ${color}`);
			output.push(`inset -20px 0px 20px -15px ${color}`);
		}
		if (
			(s.direction === "port" && !extra) ||
			(s.direction === "aft" && extra)
		) {
			output.push(`-20px 0px 20px -15px ${color}`);
			output.push(`inset 20px 0px 20px -15px ${color}`);
		}
		if (s.direction === "fore" && !extra) {
			output.push(`0px -20px 20px -15px ${color}`);
			output.push(`inset 0px 20px 20px -15px ${color}`);
		}
		if (s.direction === "aft" && !extra) {
			output.push(`0px 20px 20px -15px ${color}`);
			output.push(`inset 0px -20px 20px -15px ${color}`);
		}
		if (s.direction === "ventral" && extra) {
			output.push(`0px 20px 20px -15px ${color}`);
			output.push(`inset 0px -20px 20px -15px ${color}`);
		}
		if (s.direction === "dorsal" && extra) {
			output.push(`0px -20px 20px -15px ${color}`);
			output.push(`inset 0px 20px 20px -15px ${color}`);
		}
	});
	return output.join(",");
};

function Shields({ cardLoaded }: { cardLoaded: boolean }) {
	const [ship] = q.ship.player.useNetRequest();
	const [shields] = q.targeting.shields.get.useNetRequest();

	const topViewRef = React.useRef<HTMLDivElement>(null);
	const sideViewRef = React.useRef<HTMLDivElement>(null);

	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const shieldItems: {
			strength: number;
			maxStrength: number;
			direction: "fore" | "aft" | "starboard" | "port" | "dorsal" | "ventral";
		}[] = [];
		for (const shield of shields) {
			const strength = interpolate(shield.id)?.x || 0;
			shieldItems.push({ ...shield, strength });
		}
		topViewRef.current?.style.setProperty(
			"box-shadow",
			shieldStyle(shieldItems),
		);
		sideViewRef.current?.style.setProperty(
			"box-shadow",
			shieldStyle(shieldItems, true),
		);
	}, cardLoaded);
	if (!ship) return null;
	if (shields.length === 0) return null;
	return (
		<div>
			<div className="flex w-full gap-8 mb-4">
				<div
					ref={topViewRef}
					className="flex-1 aspect-square rounded-full p-4"
					style={{ boxShadow: shieldStyle(shields) }}
				>
					<img src={ship.assets.topView} alt="Top" />
				</div>
				{shields.length === 6 ? (
					<div
						ref={sideViewRef}
						className="flex-1 aspect-square rounded-full p-4"
						style={{ boxShadow: shieldStyle(shields, true) }}
					>
						<img src={ship.assets.sideView} alt="Side" />
					</div>
				) : null}
			</div>
			{shields[0].state === "down" ? (
				<Button
					className="btn-primary btn-sm w-full"
					onClick={() => {
						q.targeting.shields.setState.netSend({ state: "up" });
					}}
				>
					Raise Shields
				</Button>
			) : (
				<Button
					className="btn-warning btn-sm w-full"
					onClick={() => {
						q.targeting.shields.setState.netSend({ state: "down" });
					}}
				>
					Lower Shields
				</Button>
			)}
		</div>
	);
}

function PhaserArcs() {
	const [phasers] = q.targeting.phasers.list.useNetRequest();
	return (
		<>
			{phasers.map((phaser) => (
				<ConeVisualization key={phaser.id} {...phaser} />
			))}
		</>
	);
}

const up = new Vector3(0, 1, 0);
const cameraProjection = new Vector3();
const planeVector = new Vector3(0, 1, 0);
const directionVector = new Vector3();
function ConeVisualization({
	arc,
	heading,
	pitch,
	maxArc,
	maxRange,
}: {
	arc: number;
	heading: number;
	pitch: number;
	maxArc: number;
	maxRange: number;
}) {
	const [height, radius, angle, rotation] = React.useMemo(() => {
		const range = maxRange - maxRange * (arc / (maxArc + 1));

		const rotation = new Euler(
			pitch * (Math.PI / 180),
			heading * (Math.PI / 180),
			0,
		);
		const angle = arc * (Math.PI / 180);

		const radius = range * Math.tan(angle / 2);

		return [range, radius, angle, rotation];
	}, [arc, maxArc, pitch, heading, maxRange]);

	const lineLength = Math.sqrt(height ** 2 + radius ** 2);
	const coneRef = React.useRef<Line2>(null);
	const groupRef = React.useRef<Group>(null);

	useFrame(({ camera }) => {
		cameraProjection
			.copy(camera.position)
			.projectOnPlane(planeVector.set(0, 1, 0))
			.normalize();

		const angle =
			Math.atan2(cameraProjection.x, cameraProjection.y) + rotation.y;
		if (coneRef.current) {
			coneRef.current.rotation.y = angle;
		}

		groupRef.current?.quaternion.setFromUnitVectors(
			up,
			directionVector.set(0, 0, -1).applyEuler(rotation).normalize().negate(),
		);
	});
	return (
		<group ref={groupRef}>
			<mesh position={[0, -height / 2, 0]}>
				<coneGeometry args={[radius, height, 32, 1, true]} />
				<meshStandardMaterial
					depthTest={false}
					opacity={0}
					transparent
					side={DoubleSide}
				/>
				<Edges threshold={30} scale={1} renderOrder={1000} color="orange">
					<meshBasicMaterial
						transparent
						opacity={0.4}
						color="orange"
						depthTest={false}
					/>
				</Edges>
			</mesh>
			<Line
				ref={coneRef}
				rotation={[0, 0, -Math.PI / 2 - angle / 2]}
				points={[
					[lineLength, 0, 0],
					[0, 0, 0],
					[lineLength * Math.cos(angle), lineLength * Math.sin(angle), 0],
				]}
				color="orange"
				transparent
				opacity={0.4}
				depthTest={false}
			/>
		</group>
	);
}

function BeamVisualization() {
	const [firingPhasers] = q.targeting.phasers.firing.useNetRequest();
	const [{ id: playerId }] = q.ship.player.useNetRequest();

	const { interpolate } = useLiveQuery();
	const lineRef = React.useRef<Line2>(null);

	useFrame(() => {
		if (!lineRef.current) return;
		const points: number[] = [];
		const player = interpolate(playerId);
		if (!player) return;
		firingPhasers.forEach((phaser) => {
			const ship = interpolate(phaser.shipId);
			const target = interpolate(phaser.targetId);
			if (!ship || !target) return;
			points.push(ship.x - player.x, ship.y - player.y, ship.z - player.z);
			points.push(
				target.x - player.x,
				target.y - player.y,
				target.z - player.z,
			);
		});
		if (points.length === 0) {
			lineRef.current.visible = false;
		} else {
			lineRef.current.visible = true;
			lineRef.current?.geometry.setPositions(points);
			lineRef.current.material.linewidth =
				5 * Math.max(...firingPhasers.map((p) => p.firePercent));
		}
	});

	return (
		<Line
			ref={lineRef}
			points={[0, 0, 0]}
			segments
			color="orange"
			lineWidth={5}
			depthTest={false}
		/>
	);
}

function Phasers() {
	const [phasers] = q.targeting.phasers.list.useNetRequest();
	return (
		<div className="flex flex-col gap-4">
			{phasers.map((phaser) => (
				<PhaserControl key={phaser.id} {...phaser} />
			))}
		</div>
	);
}

const targetVector = new Vector3();
const playerVector = new Vector3();
const rotationQuaternion = new Quaternion();
const direction = new Vector3();
function PhaserControl({
	id,
	arc,
	maxArc,
	maxRange,
	nominalHeat,
	maxSafeHeat,
	heading,
	pitch,
}: {
	id: number;
	arc: number;
	maxArc: number;
	maxRange: number;
	nominalHeat: number;
	maxSafeHeat: number;
	heading: number;
	pitch: number;
}) {
	const { interpolate } = useLiveQuery();
	const chargeRef = React.useRef<HTMLProgressElement>(null);
	const heatRef = React.useRef<HTMLProgressElement>(null);
	const [targetedContact] = q.targeting.targetedContact.useNetRequest();
	const [{ id: playerId }] = q.ship.player.useNetRequest();
	const buttonContainerRef = React.useRef<HTMLDivElement>(null);
	useAnimationFrame(() => {
		const values = interpolate(id);
		if (!values) return;
		const { z: heat, x: charge } = values;
		if (chargeRef.current) {
			chargeRef.current.value = charge;
		}
		if (heatRef.current) {
			// Scale the heat value
			heatRef.current.value =
				(heat - nominalHeat) / (maxSafeHeat - nominalHeat);
		}
		// Check if the target is in range
		let inCone = false;
		if (targetedContact) {
			const target = interpolate(targetedContact.id);
			const player = interpolate(playerId);
			if (target && player) {
				targetVector.set(target.x, target.y, target.z);
				playerVector.set(player.x, player.y, player.z);

				const range = maxRange - maxRange * (arc / (maxArc + 1));
				rotationQuaternion.set(player.r.x, player.r.y, player.r.z, player.r.w);
				// Turn the ship rotation quaternion into a vector
				direction.set(0, 0, 1).applyQuaternion(rotationQuaternion);
				// Add the Phaser rotation to the ship rotation
				direction.applyAxisAngle(new Vector3(0, 1, 0), degToRad(heading));
				direction.applyAxisAngle(new Vector3(1, 0, 0), degToRad(pitch));
				direction.multiplyScalar(range);
				inCone = isPointWithinCone(targetVector, {
					apex: playerVector,
					angle: degToRad(arc),
					direction,
				});
			}
		}
		if (inCone) {
			buttonContainerRef.current?.childNodes.forEach((child) => {
				if (child instanceof HTMLButtonElement) {
					child.disabled = false;
					child.classList.remove("grayscale");
				}
			});
		} else {
			buttonContainerRef.current?.childNodes.forEach((child) => {
				if (child instanceof HTMLButtonElement) {
					child.disabled = true;
					child.classList.add("grayscale");
				}
			});
		}
	});

	const cache = useQueryClient();
	const getFirePhasers = (firePercent: number) => {
		return async function firePhasers() {
			await q.targeting.phasers.fire.netSend({ phaserId: id, firePercent });
			document.addEventListener(
				"pointerup",
				() => {
					q.targeting.phasers.fire.netSend({ phaserId: id, firePercent: 0 });
				},
				{ once: true },
			);
		};
	};

	React.useEffect(() => {
		return () => {
			q.targeting.phasers.fire.netSend({ phaserId: id, firePercent: 0 });
		};
	}, [id]);

	return (
		<div className="grid grid-cols-[auto_1fr]">
			<Icon name="atomic-slashes" size="sm" />
			<progress className="progress progress-warning " ref={chargeRef} />
			<Icon name="flame" size="sm" />
			<progress className="progress progress-error" ref={heatRef} />
			<Slider
				aria-label="Arc"
				minValue={0}
				maxValue={maxArc}
				step={1}
				value={arc}
				className="slider w-full col-span-2 "
				onChange={(val: number | number[]) => {
					// Manually update the local cache with the arc value so it looks really smooth
					cache.setQueryData(
						q.targeting.phasers.list.getQueryKey(),
						(data: any[]) => {
							if (!data) return data;
							return data.map((phaser) => {
								if (phaser.id === id) {
									return { ...phaser, arc: val as number };
								}
								return phaser;
							});
						},
					);
					q.targeting.phasers.setArc.netSend({
						phaserId: id,
						arc: val as number,
					});
				}}
			/>
			<div
				className="col-span-2 flex gap-1 btn-container"
				ref={buttonContainerRef}
			>
				<Button
					className="btn-xs btn-warning mt-2"
					onPointerDown={getFirePhasers(0.25)}
				>
					25%
				</Button>
				<Button
					className="btn-xs btn-warning mt-2"
					onPointerDown={getFirePhasers(0.5)}
				>
					50%
				</Button>
				<Button
					className="btn-xs btn-warning mt-2"
					onPointerDown={getFirePhasers(0.75)}
				>
					75%
				</Button>
				<Button
					className="flex-1 btn-xs btn-error mt-2"
					onPointerDown={getFirePhasers(1)}
				>
					Full
				</Button>
			</div>
		</div>
	);
}

function Torpedoes() {
	const [torpedoLaunchers] = q.targeting.torpedoes.launchers.useNetRequest();
	const [torpedoList] = q.targeting.torpedoes.list.useNetRequest();
	const [selectedTorpedo, setSelectedTorpedo] = React.useState<string | null>(
		null,
	);

	return (
		<>
			<ul className="relative panel panel-alert min-h-16 overflow-y-auto">
				{Object.entries(torpedoList ?? {}).map(
					([id, { count, yield: torpedoYield, speed }]) => (
						// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
						<li
							key={id}
							className={cn(
								"list-group-item",
								selectedTorpedo === id ? "selected" : "",
							)}
							onClick={() => setSelectedTorpedo(id)}
						>
							<div className="flex justify-between items-center">
								<div className="flex-1 flex flex-col">
									<span>{id}</span>
									<span className="text-sm text-gray-400">
										Yield: {megaWattHourToGigaJoule(torpedoYield)} GJ · Speed:{" "}
										{speed} km/s
									</span>
								</div>
								<div>{count}</div>
							</div>
						</li>
					),
				)}
			</ul>
			<div className="overflow-y-auto flex flex-col flex-1 gap-4">
				{torpedoLaunchers?.map((launcher) => (
					<Launcher
						launcherId={launcher.id}
						key={launcher.id}
						selectedTorpedo={selectedTorpedo}
						{...launcher}
					/>
				))}
			</div>
		</>
	);
}

function ObjectData({ objectId }: { objectId: number }) {
	const [object, distanceRef] = useObjectData(objectId);
	return object ? (
		<div className="flex items-center gap-2">
			<ObjectImage object={object} className="border-0 border-r p-2" />

			<div>
				<h3 className="text-lg">{object.name}</h3>
				<h4>{object.classification}</h4>
				<h4 className="tabular-nums">
					<strong>Distance:</strong> <span ref={distanceRef} />
				</h4>
			</div>
		</div>
	) : (
		<h3 className="text-2xl">Accessing...</h3>
	);
}

function Launcher({
	launcherId,
	name,
	state,
	loadTime,
	selectedTorpedo,
	torpedo,
}: {
	launcherId: number;
	state: "ready" | "loading" | "unloading" | "loaded" | "firing";
	name: string;
	loadTime: number;
	selectedTorpedo: string | null;
	torpedo: {
		casingColor: string | undefined;
		guidanceColor: string | undefined;
		guidanceMode: string | undefined;
		warheadColor: string | undefined;
		warheadDamageType: string | undefined;
	} | null;
}) {
	const torpedoRef = React.useRef<SVGSVGElement>(null);
	const animationTime =
		state === "loading" || state === "unloading" ? loadTime : 100;
	return (
		<div className="select-none">
			<p className="text-right">{name}</p>
			<div className="relative">
				<img draggable={false} src={LauncherImage} alt="Torpedo Launcher" />
				<div className="absolute w-[54%] h-[calc(65%)] top-[4%] left-[39%] overflow-hidden pointer-events-none">
					{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
					<svg
						className="absolute w-full h-full"
						ref={torpedoRef}
						style={{
							maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
							maskSize: "100% 200%",
							maskRepeat: "no-repeat",
							maskPosition:
								state === "ready" || state === "unloading" ? "0 -100%" : "200%",
							transition: `mask-position ${animationTime}ms ease, transform ${animationTime}ms ease, opacity 1ms linear 500ms`,
							transform:
								state === "ready" || state === "unloading"
									? "translateY(-100%)"
									: state === "firing"
									  ? "translateX(-100%)"
									  : "translateY(0)",
							opacity: state === "firing" ? 0 : 1,
						}}
					>
						<use
							href={`${href}#casing`}
							className="text-red-500"
							style={{ color: torpedo?.casingColor }}
						/>
						{torpedo?.warheadDamageType ? (
							<use
								href={`${href}#warhead-${torpedo.warheadDamageType}`}
								className="text-blue-500"
								style={{
									transform: `scale(0.48) translate(13px, 0)`,
									color: torpedo.warheadColor,
								}}
							/>
						) : null}
						{torpedo?.guidanceMode ? (
							<use
								href={`${href}#guidance-${torpedo.guidanceMode}`}
								className="text-green-500"
								style={{
									transform: `scale(0.48) translate(257px, 9px)`,
									color: torpedo.guidanceColor,
								}}
							/>
						) : null}
					</svg>
				</div>
			</div>
			<div className="flex justify-center gap-2 mt-1">
				<div className="w-32" />
				<Button
					className={cn(
						"btn-xs min-w-16",
						(state === "loaded" || selectedTorpedo) &&
							!["loading", "unloading", "firing"].includes(state)
							? "btn-primary"
							: "btn-disabled",
					)}
					onClick={() => {
						if (selectedTorpedo || state === "loaded")
							q.targeting.torpedoes.load.netSend({
								launcherId,
								torpedoId: state === "loaded" ? null : selectedTorpedo,
							});
					}}
				>
					{state === "loaded" ? "Unload" : "Load"}
				</Button>
				<Button
					className={cn(
						"btn-xs min-w-16",
						state === "loaded" ? "btn-error" : "btn-disabled",
					)}
					onClick={() => {
						if (state === "loaded")
							q.targeting.torpedoes.fire.netSend({
								launcherId,
							});
					}}
				>
					Fire
				</Button>
			</div>
		</div>
	);
}
