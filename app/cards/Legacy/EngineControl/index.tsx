import { getMaxSpeedIndex } from "@thorium/cards/Legacy/EngineControl/getMaxSpeedIndex";
import { HeatBars } from "@thorium/cards/Legacy/ReactorControl/HeatBars";
import { q } from "@thorium/context/AppContext";
import type { EngineSpeed } from "@thorium/ecs-components/shipSystems/engineSpeeds";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { cn } from "@thorium/utils/cn";

export function LegacyEngineControl() {
	const { shipId } = useStation();

	const [{ warpEngines, impulseEngines }] = q.legacy.engineControl.get.useNetRequest({ shipId });

	return (
		<div className="flex h-full w-full flex-col">
			<div className="flex gap-4">
				{impulseEngines ? (
					<SpeedControl
						id={impulseEngines.id}
						name={impulseEngines.name}
						speeds={impulseEngines.speeds}
						speedIndex={Math.trunc(
							(impulseEngines.currentSpeed / impulseEngines.cruisingSpeed) *
								(impulseEngines.speeds.length - 1),
						)}
						speedChange={(index) =>
							q.legacy.engineControl.setSpeed.netSend({
								shipId,
								impulseSpeedIndex: index,
							})
						}
					/>
				) : null}
				{warpEngines ? (
					<SpeedControl
						id={warpEngines.id}
						name={warpEngines.name}
						speeds={warpEngines.speeds}
						speedIndex={warpEngines.currentWarpFactor}
						speedChange={(index) =>
							q.legacy.engineControl.setSpeed.netSend({
								shipId,
								warpSpeedIndex: index + 1,
							})
						}
					/>
				) : null}
			</div>
			<div className="mt-4 flex justify-center">
				<Button
					className="btn-alert w-1/4"
					onClick={() =>
						q.legacy.engineControl.setSpeed.netSend({
							shipId,
						})
					}
				>
					Full Stop
				</Button>
			</div>
			<div className="mt-4 grid flex-auto grid-cols-5 gap-4">
				{impulseEngines ? (
					<>
						<div className="space-y-2">
							{impulseEngines.speeds.map((s, index) => (
								<Button
									key={s.label}
									className="btn-alert w-full"
									onClick={() =>
										q.legacy.engineControl.setSpeed.netSend({
											shipId,
											impulseSpeedIndex: index,
										})
									}
								>
									{s.label}
								</Button>
							))}
						</div>
						<div>
							{typeof impulseEngines.nominalHeat !== "undefined" &&
							typeof impulseEngines.maxHeat !== "undefined" ? (
								<HeatBars
									id={impulseEngines.id}
									nominalHeat={impulseEngines.nominalHeat}
									maxHeat={impulseEngines.maxHeat}
								/>
							) : null}
						</div>
					</>
				) : null}
				<div />
				{warpEngines ? (
					<>
						<div>
							{typeof warpEngines.nominalHeat !== "undefined" &&
							typeof warpEngines.maxHeat !== "undefined" ? (
								<HeatBars
									id={warpEngines.id}
									nominalHeat={warpEngines.nominalHeat}
									maxHeat={warpEngines.maxHeat}
								/>
							) : null}
						</div>
						<div className="space-y-2">
							{warpEngines.speeds.map((speed, index) => (
								<Button
									key={index}
									className="btn-alert w-full"
									onClick={() =>
										q.legacy.engineControl.setSpeed.netSend({
											shipId,
											warpSpeedIndex: index + 1,
										})
									}
								>
									{speed.label}
								</Button>
							))}
						</div>
					</>
				) : null}
			</div>
		</div>
	);
}

function SpeedControl({
	id,
	name,
	speeds,
	speedIndex,
	speedChange,
}: {
	id: number;
	name: string;
	speeds: EngineSpeed[];
	speedIndex: number;
	speedChange: (index: number) => void;
}) {
	const [power] = q.legacy.powerDistribution.systemPower.useNetRequest({
		systemId: id,
	});

	const powerWidth = Math.min(
		1,
		Math.max(0, getMaxSpeedIndex(power.powerLevels || [], power.currentPower || 0)),
	);
	return (
		<div className="w-full">
			<p className="text-lg">{name}</p>

			<div className="relative flex w-full items-center overflow-hidden">
				{speeds.map((speed, i) => (
					<button
						key={speed.label}
						className={cn(
							"relative cursor-pointer border-l last-of-type:border-r flex-1 pt-1 text-center z-10",
							"after:block after:h-8 after:border-b after:border-t after:z-10",
						)}
						onClick={() => speedChange(i)}
					>
						{speed.number}
					</button>
				))}
				<div
					className="absolute top-0 left-0 h-7 w-full bg-gradient-to-l from-green-600 to-green-800 transition-transform duration-300 ease-in-out"
					style={{
						transform: `translate(calc(-100% + ${powerWidth * 100}%), 0px)`,
					}}
				/>
				<div
					className="absolute bottom-0 left-0 h-8 w-full bg-gradient-to-b from-yellow-300 via-yellow-950 to-yellow-300 bg-[length:3px_3px] transition-transform duration-300 ease-in-out"
					style={{
						transform: `translate(calc(-100% + ${(speedIndex / speeds.length) * 100}%), 0px)`,
					}}
				/>
			</div>
		</div>
	);
}
