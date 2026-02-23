import { useEffect, useRef, useState } from "react";

import { useSpring, animated as a } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import throttle from "lodash.throttle";
import type { KilometerPerSecond } from "@thorium/utils/unitTypes";
import useMeasure from "@thorium/hooks/useMeasure";
import Button from "@thorium/ui/Button";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { q } from "@thorium/context/AppContext";
import {
	useGamepadPress,
	useGamepadValue,
} from "@thorium/hooks/useGamepadStore";
import { useStation } from "@thorium/routes/station/useStation";
import { useCardContext } from "@thorium/context/CardContext";
import { cn } from "@thorium/utils/cn";

const C_IN_METERS = 299792458;
export function formatSpeed(speed: KilometerPerSecond) {
	if (Math.abs(speed) > C_IN_METERS / 1000 / 2) {
		return `${(speed / (C_IN_METERS / 1000)).toLocaleString(undefined, {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		})} C`;
	}
	if (Math.abs(speed) > 1) {
		return `${speed.toLocaleString(undefined, {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		})} km/s`;
	}

	return `${(speed * 1000).toLocaleString(undefined, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	})} m/s`;
}

export function useForwardVelocity() {
	const { shipId } = useStation();
	const [{ id: impulseId }] = q.pilot.impulseEngines.get.useNetRequest({
		shipId,
	});
	const [{ id: warpId, currentWarpFactor }] =
		q.pilot.warpEngines.get.useNetRequest({ shipId });
	const [ship] = q.navigation.ship.useNetRequest({ shipId });
	const { interpolate } = useLiveQuery();

	return function getForwardVelocity(): [
		KilometerPerSecond,
		KilometerPerSecond,
	] {
		const id = currentWarpFactor ? warpId : impulseId;
		const { f: forwardVelocity } = interpolate(ship.id) || { f: 0 };
		const { x: targetSpeed } = interpolate(id) || { x: 0 };
		return [forwardVelocity, targetSpeed] as [
			KilometerPerSecond,
			KilometerPerSecond,
		];
	};
}
const ForwardVelocity = () => {
	const { cardLoaded } = useCardContext();
	const forwardRef = useRef<HTMLDivElement>(null);
	const targetRef = useRef<HTMLDivElement>(null);
	const getForwardVelocity = useForwardVelocity();

	useAnimationFrame(() => {
		const [forwardVelocity, targetVelocity] = getForwardVelocity();
		if (targetRef.current) {
			targetRef.current.textContent = formatSpeed(targetVelocity);
		}
		if (forwardRef.current) {
			forwardRef.current.textContent = formatSpeed(forwardVelocity);
		}
	}, cardLoaded);

	return (
		<>
			<div className="panel flex items-center px-4">
				<div className="max-w-min text-right leading-tight">
					Forward Velocity
				</div>
				<div
					className="w-full text-right font-bold text-2xl my-2 tabular-nums"
					ref={forwardRef}
				>
					{formatSpeed(0)}
				</div>
			</div>
			<div className="panel flex items-center px-4">
				<div className="max-w-min text-right leading-tight">
					Target Velocity
				</div>

				<p
					className="w-full text-right font-bold text-2xl my-2 tabular-nums"
					ref={targetRef}
				>
					{formatSpeed(0)}
				</p>
			</div>
		</>
	);
};

const KNOB_HEIGHT = 44;
const BUTTON_OFFSET = 0.8;
export const ImpulseControls = ({ cardLoaded = true, onFlightControlInteraction, forwardAutopilot, showWarning }: { cardLoaded?: boolean; onFlightControlInteraction?: () => void; forwardAutopilot?: boolean; showWarning?: (entry: { id: string; priority: number; content: string; duration?: number }) => void }) => {
	const { shipId } = useStation();
	const [{ targetSpeed, cruisingSpeed, emergencySpeed, name, speeds, allocatedPower, maxSafePower }] =
		q.pilot.impulseEngines.get.useNetRequest({ shipId });

	const maxAchievableSpeed = cruisingSpeed * (allocatedPower / maxSafePower);

	const prevAllocatedPowerRef = useRef(allocatedPower);
	const prevTargetSpeedRef = useRef(targetSpeed);
	useEffect(() => {
		if (allocatedPower < prevAllocatedPowerRef.current) {
			const maxAchievable = cruisingSpeed * (allocatedPower / maxSafePower);
			if (prevTargetSpeedRef.current > maxAchievable) {
				showWarning?.({
					id: "insufficient-impulse-power",
					priority: 5,
					content: "INSUFFICIENT IMPULSE POWER",
					duration: 5000,
				});
			}
		}
		prevAllocatedPowerRef.current = allocatedPower;
		prevTargetSpeedRef.current = targetSpeed;
	}, [allocatedPower, targetSpeed, cruisingSpeed, maxSafePower, showWarning]);

	const [{ currentWarpFactor, speeds: warpSpeeds }] =
		q.pilot.warpEngines.get.useNetRequest({ shipId });
	const downRef = useRef(false);
	const [ref, measurement, getMeasurements] = useMeasure<HTMLDivElement>();
	const [{ y }, set] = useSpring(() => ({
		y: 0,
		config: { mass: 1, tension: 280, friction: 30 },
	}));

	const callback = useRef(
		throttle((speed: number) => {
			q.pilot.impulseEngines.setSpeed.netSend({
				speed: Math.min(emergencySpeed, Math.max(0, speed)),
				shipId,
			});
			if (speed === 0) {
				q.pilot.warpEngines.setWarpFactor.netSend({ factor: 0, shipId });
			}
		}, 100),
	);

	const bind = useDrag(
		({ down, first, offset: [_, yVal] }) => {
			if (first) onFlightControlInteraction?.();
			downRef.current = down;
			set({
				y: yVal,
				immediate: down,
			});
			const normalizedValue = Math.min(
				1,
				Math.abs(1 - yVal) / (measurement.height - KNOB_HEIGHT),
			);

			const speedValue =
				normalizedValue < 0.005
					? 0
					: normalizedValue <= BUTTON_OFFSET
						? normalizedValue * (1 / BUTTON_OFFSET) * cruisingSpeed
						: (normalizedValue - BUTTON_OFFSET) *
								(1 / (1 - BUTTON_OFFSET)) *
								(emergencySpeed - cruisingSpeed) +
							cruisingSpeed;
			callback.current(speedValue);
		},
		{
			axis: "y",
			bounds: { bottom: 0, top: -measurement.height + KNOB_HEIGHT },
			from: () => [0, y.get()],
		},
	);

	const height = measurement.height;
	// biome-ignore lint/correctness/useExhaustiveDependencies: We want to re-run this when the card re-loads
	useEffect(() => {
		if (downRef.current) return;
		getMeasurements();
		const y =
			(targetSpeed / cruisingSpeed <= 1
				? (targetSpeed / cruisingSpeed) * BUTTON_OFFSET
				: BUTTON_OFFSET +
					((targetSpeed - cruisingSpeed) / (emergencySpeed - cruisingSpeed)) *
						(1 - BUTTON_OFFSET)) *
			(-height + KNOB_HEIGHT);
		set({
			y,
		});
	}, [
		targetSpeed,
		cruisingSpeed,
		emergencySpeed,
		set,
		height,
		getMeasurements,
		cardLoaded,
	]);

	useGamepadValue("impulse-speed", (value) => {
		const throttleValue = (value + 1) / 2;
		callback.current(throttleValue * cruisingSpeed);
	});

	const [impulseAdjust, setImpulseAdjust] = useState(0);
	const impulseAdjustVelocity = useRef(0);
	useGamepadValue("impulse-adjust", (value) => {
		setImpulseAdjust(value);
		impulseAdjustVelocity.current = 0;
	});

	useAnimationFrame(
		() => {
			const adjust =
				Math.min(
					Math.abs(impulseAdjustVelocity.current),
					Math.abs(impulseAdjust),
				) * Math.sign(impulseAdjust);
			callback.current(targetSpeed + adjust);
			impulseAdjustVelocity.current += impulseAdjust / 500;
		},
		impulseAdjust !== 0 && cardLoaded,
	);

	// Warp Gamepad Control
	const [warpFocus, setWarpFocus] = useState(0);

	useGamepadValue("warp-focus-set", (value) => {
		setWarpFocus(
			Math.max(
				0,
				Math.min(
					warpSpeeds.length + 1,
					Math.round(((value + 1) / 2) * (warpSpeeds.length + 1)),
				),
			),
		);
	});
	useGamepadPress("warp-focus-adjust", {
		onDown: (val) => {
			setWarpFocus((focus) =>
				Math.max(0, Math.min(warpSpeeds.length + 1, Math.round(val + focus))),
			);
		},
	});
	useGamepadPress("warp-engage", {
		onDown: () => {
			q.pilot.warpEngines.setWarpFactor.netSend({
				factor: warpFocus,
				shipId,
			});
			setWarpFocus(0);
		},
	});
	useGamepadPress("full-stop", {
		onDown: () => {
			callback.current(0);
			setWarpFocus(0);
		},
	});
	return (
		<div className="select-none flex-1">
			<div>
				<div className="flex flex-col gap-1 forward-velocity">
					<ForwardVelocity />
				</div>
				{/* TODO: Include heat indicator here eventually. */}

				<div className="flex mt-2">
					<div className="flex-1">
						<div className="flex">
							<div className="flex flex-1 justify-around flex-col-reverse text-right gap-1 impulse-speeds">
								<Button
									className="btn-notice w-full full-stop"
									onClick={() => {
										onFlightControlInteraction?.();
										callback.current(0);
									}}
								>
									Full Stop
								</Button>
								{speeds.map((speed, i) => {
									const buttonSpeed =
										i === speeds.length - 1
											? emergencySpeed
											: cruisingSpeed * ((i + 1) / (speeds.length - 1));
									const insufficientPower = buttonSpeed > maxAchievableSpeed;
									return (
									<Button
										key={`${speed}${i}`}
										disabled={insufficientPower}
										onClick={() => {
											onFlightControlInteraction?.();
											callback.current(buttonSpeed);
										}}
										className={cn("btn-primary btn-sm", {
											"btn-error": i === speeds.length - 1,
											"btn-warning": i === speeds.length - 2,
											"btn-disabled": insufficientPower,
											"opacity-50": forwardAutopilot,
										})}
									>
										{speed.label}
									</Button>
								);})}
							</div>
							<div className="w-1" />
							<div
								ref={ref}
								className={cn("relative bg-blackAlpha-500 border-2 border-whiteAlpha-500 rounded-full flex justify-center items-end impulse-bar", { "opacity-50": forwardAutopilot })}
							>
								<a.div
									{...bind()}
									style={{
										transform: y?.to((y) => `translate3d(0px,${y}px,0)`),
									}}
									// @ts-expect-error
									className="z-10 w-10 h-10 rounded-full border-black/50 border-2 bg-gray-500 shadow-md cursor-pointer touch-none"
								/>
							</div>
						</div>
					</div>
					<div className="w-1" />
					<div className="flex-1">
						<div
							className={cn(
								"grid h-full max-h-56 gap-1 flex-wrap warp-speeds",
								{
									"grid-cols-2": warpSpeeds.length > 6,
								},
							)}
						>
							{warpSpeeds.slice().reverse().map(({ label }, i, arr) => {
								const warpFactor = arr.length - i;
								return (
									<Button
										key={`warp-${warpFactor}`}
										className={`btn-sm btn-primary ${
											warpFocus === warpFactor ? "gamepad-focus" : ""
										} ${warpFactor === currentWarpFactor ? "btn-active" : ""} ${forwardAutopilot ? "opacity-50" : ""}`}
										onClick={() => {
											onFlightControlInteraction?.();
											q.pilot.warpEngines.setWarpFactor.netSend({
												factor: warpFactor,
												shipId,
											});
										}}
									>
										{label}
									</Button>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
