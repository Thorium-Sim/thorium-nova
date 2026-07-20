import { q, clientId } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import { LiveQueryError } from "@thorium/utils/live-query/client/client";
import { megaWattHourToGigaJoule } from "@thorium/utils/unitTypes";
import { useRef, useState } from "react";

import LauncherImage from "./assets/launcher.svg";
import href from "./assets/torpedoSprite.svg?url";

export function Torpedoes() {
	const { shipId } = useStation();
	const [torpedoLaunchers] = q.targeting.torpedoes.launchers.useNetRequest({
		shipId,
	});
	const [torpedoList] = q.targeting.torpedoes.list.useNetRequest({ shipId });
	const [selectedTorpedo, setSelectedTorpedo] = useState<string | null>(null);

	return (
		<>
			<ul className="panel panel-alert torpedoes-list relative max-h-1/3 min-h-16 overflow-y-auto">
				{Object.entries(torpedoList ?? {}).map(
					([id, { count, yield: torpedoYield, speed, energy }]) => (
						<li
							key={id}
							className={cn("list-group-item", selectedTorpedo === id ? "selected" : "")}
							onClick={() => {
								setSelectedTorpedo(id);
								q.thorium.genericEvent.netSend({
									clientId,
									eventName: "torpedo-pick",
									properties: "",
								});
							}}
						>
							<div className="flex items-center gap-1">
								<span>{id}</span>
								<div className="grow" />
								<Tooltip
									className="flex aspect-square h-5 w-5 items-center justify-center rounded-full border border-white bg-black text-sm"
									content={<>Yield: {megaWattHourToGigaJoule(torpedoYield)} Gigajoules</>}
								>
									<Icon name="sun" className="text-yellow-500" />
								</Tooltip>
								<Tooltip
									className="flex aspect-square h-5 w-5 items-center justify-center rounded-full border border-white bg-black text-sm"
									content={<>Speed: {speed} km/s</>}
								>
									<Icon name="gauge" className="text-green-500" />
								</Tooltip>
								<Tooltip
									className="flex aspect-square h-5 w-5 items-center justify-center rounded-full border border-white bg-black text-sm"
									content={<>Launch Energy: {energy} Megawatt Seconds</>}
								>
									<Icon name="zap" className="text-orange-300" />
								</Tooltip>
								<div className="ml-2 tabular-nums">{count}</div>
							</div>
						</li>
					),
				)}
			</ul>
			<div className="torpedoes-launchers flex flex-1 flex-col gap-4 overflow-y-auto">
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

function Launcher({
	launcherId,
	name,
	state,
	loadTime,
	selectedTorpedo,
	torpedo,
}: {
	launcherId: number;
	state: "ready" | "loading" | "unloading" | "loaded" | "firing" | "fired";
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
	const torpedoRef = useRef<SVGSVGElement>(null);
	const animationTime = state === "loading" || state === "unloading" ? loadTime : 100;
	return (
		<div className="select-none">
			<p className="text-right">{name}</p>
			<div className="relative">
				<img draggable={false} src={LauncherImage} alt="Torpedo Launcher" />
				<div className="pointer-events-none absolute top-[4%] left-[39%] h-[calc(65%)] w-[54%] overflow-hidden">
					<svg
						className="absolute h-full w-full"
						ref={torpedoRef}
						style={{
							maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
							maskSize: "100% 200%",
							maskRepeat: "no-repeat",
							maskPosition: state === "ready" || state === "unloading" ? "0 -100%" : "200%",
							transition: `mask-position ${animationTime}ms ease, transform ${animationTime}ms ease, opacity 1ms linear 500ms`,
							transform:
								state === "ready" || state === "unloading"
									? "translateY(-100%)"
									: state === "fired"
										? "translateX(-100%)"
										: "translateY(0)",
							opacity: state === "fired" ? 0 : 1,
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
			<div className="mt-1 flex justify-center gap-2">
				<div className="w-32" />
				<Button
					className={cn(
						"btn-xs min-w-16",
						(state === "loaded" || selectedTorpedo) &&
							!["loading", "unloading", "firing", "fired"].includes(state)
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
					className={cn("btn-xs min-w-16", state === "loaded" ? "btn-error" : "btn-disabled")}
					onClick={async () => {
						try {
							if (state === "loaded") {
								await q.targeting.torpedoes.fire.netSend({
									launcherId,
								});
							}
						} catch (err) {
							if (err instanceof LiveQueryError) {
								toast({
									title: "Unable to fire torpedoes",
									body: err.error,
									color: "error",
								});
							}
						}
					}}
				>
					{state === "firing" ? "Firing..." : "Fire"}
				</Button>
			</div>
		</div>
	);
}
