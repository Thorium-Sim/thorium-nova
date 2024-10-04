import { q } from "@client/context/AppContext";
import { cn } from "@client/utils/cn";
import { megaWattHourToGigaJoule } from "@server/utils/unitTypes";
import { useRef, useState } from "react";
import LauncherImage from "./assets/launcher.svg";
import href from "./assets/torpedoSprite.svg?url";
import Button from "@thorium/ui/Button";
import { toast } from "@client/context/ToastContext";
import { LiveQueryError } from "@thorium/live-query/client/client";

export function Torpedoes() {
	const [torpedoLaunchers] = q.targeting.torpedoes.launchers.useNetRequest();
	const [torpedoList] = q.targeting.torpedoes.list.useNetRequest();
	const [selectedTorpedo, setSelectedTorpedo] = useState<string | null>(null);

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
	const torpedoRef = useRef<SVGSVGElement>(null);
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
					Fire
				</Button>
			</div>
		</div>
	);
}
