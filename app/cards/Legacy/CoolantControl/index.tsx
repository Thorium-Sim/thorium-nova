import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import bracket from "./bracket.svg?url";
import tankBg from "./tank-bg.svg?url";
import tank from "./tank.svg?url";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import { cn } from "@thorium/utils/cn";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { useRef } from "react";
export function LegacyCoolantControl() {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();
	const { interpolate } = useLiveQuery();

	const [systems] = q.legacy.coolantControl.systems.useNetRequest({ shipId });
	const [coolantTank] = q.legacy.coolantControl.tank.useNetRequest({ shipId });
	q.legacy.coolantControl.stream.useDataStream({ shipId });

	const transferSystem = coolantTank.transferSystem;
	const transferIndex = systems.findIndex((sys) => sys.id === transferSystem);

	const tankRef = useRef<HTMLDivElement>(null);

	useAnimationFrame(() => {
		const coolant = interpolate(coolantTank.id)?.c || 0;

		if (tankRef.current) {
			tankRef.current.style.height = `${coolant * 100}%`;
		}
	}, cardLoaded);

	return (
		<div className="h-full grid grid-cols-5">
			<div className="col-span-2 flex flex-col items-center">
				<div className="max-w-3/4 relative">
					<div
						className="w-full h-full absolute left-0 bottom-0"
						style={{
							clipPath: `polygon(0 20%, 2% 20%, 2% 100%, 98% 100%, 98% 20%, 98% 15%, 90.5% 8%, 80% 4%, 65% 1%, 50% 0, 35% 1%, 20% 4%, 9.5% 8%, 2% 15%, 2% 20%, 0 20%)`,
						}}
					>
						<div
							className="absolute bottom-0 from-blue-700 to to-blue-400 via-blue-500 bg-gradient-to-t w-full"
							ref={tankRef}
						/>
					</div>
					<SVGImageLoader url={tank} className="w-full absolute" />
					<SVGImageLoader url={tankBg} className="w-full" />
				</div>
				<div
					className={cn(
						"bg-black w-12 h-12 border-x-2 border-white/50 flex-1",
						{ "bg-blue-500": transferIndex > -1 },
					)}
				/>
				<div className="flex w-full">
					<div className="flex-1" />
					<div
						className={cn(
							"bg-black w-12 h-12 border-b-2 border-l-2 border-white/50 rounded-bl-xl",
							{ "bg-blue-500": transferIndex > -1 },
						)}
					/>
					<div
						className={cn("bg-black h-12 flex-1 border-y-2 border-white/50", {
							"bg-blue-500": transferIndex > -1,
						})}
					/>
				</div>
			</div>
			<div className="col-span-3 col-start-3">
				<div className="flex flex-col items-start justify-center h-full">
					{systems.map(({ id, name }, i) => (
						<SystemBar
							key={id}
							id={id}
							name={name}
							index={i}
							transferIndex={transferIndex}
							tankId={coolantTank.id}
						/>
					))}
					<div
						className={cn(
							"bg-black w-12 h-12 border-white/50 border-r-2 border-b-2 rounded-br-xl",
							{ "bg-blue-500": transferIndex > -1 },
						)}
					/>
				</div>
			</div>
		</div>
	);
}

function SystemBar({
	id,
	name,
	index,
	transferIndex,
	tankId,
}: {
	id: number;
	name: string;
	index: number;
	transferIndex: number;
	tankId: number;
}) {
	const { cardLoaded } = useCardContext();
	const { interpolate } = useLiveQuery();

	const tankRef = useRef<HTMLDivElement>(null);

	useAnimationFrame(() => {
		const coolant = interpolate(id)?.c || 0;

		if (tankRef.current) {
			tankRef.current.style.width = `${coolant * 100}%`;
		}
	}, cardLoaded);

	return (
		<>
			<div className="flex w-full min-h-0">
				<div
					className={cn(
						"bg-black border-white/50 border-l-2 w-12 max-h-12 right-12 top-0",
						{
							"border-t-2 rounded-tl-xl": index === 0,
							"bg-blue-500": index >= transferIndex && transferIndex > -1,
							"border-t-2": index === transferIndex,
							"border-r-2":
								index >= transferIndex &&
								index !== transferIndex &&
								transferIndex > -1,
						},
					)}
				/>
				<div
					className={cn(
						"min-h-0 bg-black border-white/50 border-y-2 w-12 max-h-12 z-10",
						{
							"bg-blue-500": index === transferIndex,
						},
					)}
				/>
				<SVGImageLoader url={bracket} className="z-20 max-h-12 -ml-1 -mr-1" />
				<div className="h-full flex-1 bg-black border-y-2 border-white/50 z-10 relative flex items-center">
					<div
						className="absolute left-0 top-0 h-full from-blue-700 to to-blue-400 via-blue-500 bg-gradient-to-t"
						ref={tankRef}
					/>
					<p className="absolute left-4">{name}</p>
				</div>
				<SVGImageLoader
					url={bracket}
					className="-scale-x-100 -ml-1 z-20 max-h-12"
				/>
			</div>
			<div className="flex flex-1 gap-4 w-full">
				<div
					className={cn("bg-black w-12 border-white/50 border-x-2 h-full", {
						"bg-blue-500": index >= transferIndex && transferIndex > -1,
					})}
				/>
				<div className="flex-1" />

				<Button
					className="btn-primary mt-2 mb-2"
					onPointerDown={() => {
						q.legacy.coolantControl.setTransfer.netSend({
							coolantTankId: tankId,
							systemId: id,
							transferDirection: "in",
						});
						document.addEventListener(
							"pointerup",
							() => {
								q.legacy.coolantControl.setTransfer.netSend({
									coolantTankId: tankId,
									systemId: -1,
									transferDirection: "in",
								});
							},
							{ once: true },
						);
					}}
				>
					<Icon name="arrow-left" /> Fill Reservoir
				</Button>
				<Button
					className="btn-primary mt-2 mb-2"
					onPointerDown={() => {
						q.legacy.coolantControl.setTransfer.netSend({
							coolantTankId: tankId,
							systemId: id,
							transferDirection: "out",
						});
						document.addEventListener(
							"pointerup",
							() => {
								q.legacy.coolantControl.setTransfer.netSend({
									coolantTankId: tankId,
									systemId: -1,
									transferDirection: "out",
								});
							},
							{ once: true },
						);
					}}
				>
					Fill Coolant <Icon name="arrow-right" />
				</Button>
			</div>
		</>
	);
}
