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

/**
 * TODO:
 * Display torpedo on viewscreen
 * Make torpedos not look dumb.
 * Make torpedos rotate towards their velocity.
 * Add overlays to the targeting grid showing where the torpedo will fire from
 */
export function Targeting({ cardLoaded }: CardProps) {
	const setTarget = q.targeting.setTarget.useNetSend();
	const [targetedContact] = q.targeting.targetedContact.useNetRequest();
	const clickRef = React.useRef(false);
	return (
		<CircleGridStoreProvider zoomMax={25000}>
			<div className="grid grid-cols-4 h-full place-content-center gap-4">
				<div className="flex flex-col justify-between">Hi</div>
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
				<div className="h-full flex flex-col justify-between gap-2">
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

const kilowattHourToGigajoules = (kwh: number) => kwh * 0.0036;
function Torpedoes() {
	const [torpedoLaunchers] = q.targeting.torpedoLaunchers.useNetRequest();
	const [torpedoList] = q.targeting.torpedoList.useNetRequest();
	const [selectedTorpedo, setSelectedTorpedo] = React.useState<string | null>(
		null,
	);

	return (
		<div className="flex-1 flex flex-col gap-4">
			<ul className="relative panel panel-alert min-h-16">
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
										Yield: {torpedoYield} GJ · Speed: {speed} km/s
									</span>
								</div>
								<div>{count}</div>
							</div>
						</li>
					),
				)}
			</ul>
			{torpedoLaunchers?.map((launcher) => (
				<Launcher
					launcherId={launcher.id}
					key={launcher.id}
					selectedTorpedo={selectedTorpedo}
					{...launcher}
				/>
			))}
		</div>
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
		<div className="select-none relative">
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
