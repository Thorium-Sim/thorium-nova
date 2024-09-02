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
import { megaWattHourToGigaJoule } from "@server/utils/unitTypes";
import type { ShieldDirections } from "@server/classes/Plugins/ShipSystems/Shields";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import { useLiveQuery } from "@thorium/live-query/client";
import chroma from "chroma-js";

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

	return (
		<CircleGridStoreProvider zoomMax={25000}>
			<div className="grid grid-cols-4 h-full place-content-center gap-4">
				<div className="flex flex-col justify-between">
					<Shields cardLoaded={cardLoaded} />
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
							<CircleGrid>
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
		if (s.direction === "starboard") {
			output.push(`20px 0px 20px -15px ${color}`);
			output.push(`inset -20px 0px 20px -15px ${color}`);
		}
		if (s.direction === "port") {
			output.push(`-20px 0px 20px -15px ${color}`);
			output.push(`inset 20px 0px 20px -15px ${color}`);
		}
		if (s.direction === "aft" && !extra) {
			output.push(`0px -20px 20px -15px ${color}`);
			output.push(`inset 0px 20px 20px -15px ${color}`);
		}
		if (s.direction === "fore" && !extra) {
			output.push(`0px 20px 20px -15px ${color}`);
			output.push(`inset 0px -20px 20px -15px ${color}`);
		}
		if (s.direction === "dorsal" && extra) {
			output.push(`0px 20px 20px -15px ${color}`);
			output.push(`inset 0px -20px 20px -15px ${color}`);
		}
		if (s.direction === "ventral" && extra) {
			output.push(`0px -20px 20px -15px ${color}`);
			output.push(`inset 0px 20px 20px -15px ${color}`);
		}
	});
	console.log(output);
	return output.join(",");
};

function Shields({ cardLoaded }: { cardLoaded: boolean }) {
	const [ship] = q.ship.player.useNetRequest();
	const [shields] = q.targeting.shields.get.useNetRequest();

	const topViewRef = React.useRef<HTMLDivElement>(null);
	const sideViewRef = React.useRef<HTMLDivElement>(null);

	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const shieldItems = [];
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

function Torpedoes() {
	const [torpedoLaunchers] = q.targeting.torpedoLaunchers.useNetRequest();
	const [torpedoList] = q.targeting.torpedoList.useNetRequest();
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
							q.targeting.loadTorpedo.netSend({
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
							q.targeting.fireTorpedo.netSend({
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
