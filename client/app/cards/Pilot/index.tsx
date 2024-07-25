import Button from "@thorium/ui/Button";
import type { CardProps } from "@client/routes/flight.station/CardProps";
import { Fragment, Suspense, useRef } from "react";
import { GridCanvas, CircleGrid, CircleGridTiltButton } from "./CircleGrid";
import { PilotZoomSlider } from "./PilotZoomSlider";
import {
	CircleGridStoreProvider,
	useCircleGridStore,
} from "./useCircleGridStore";
import { ImpulseControls } from "./ImpulseControls";
import { Joystick, LinearJoystick } from "@thorium/ui/Joystick";
import type { ReactNode } from "react";
import type { Coordinates } from "@server/utils/unitTypes";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import { q } from "@client/context/AppContext";
import { useLiveQuery } from "@thorium/live-query/client";
import { useGamepadPress } from "@client/hooks/useGamepadStore";
import { CircleGridContacts, CircleGridWaypoints } from "./PilotContacts";

async function rotation({ x, y, z }: Partial<Coordinates<number>>) {
	await q.pilot.thrusters.setRotationDelta.netSend({ rotation: { x, y, z } });
}
async function direction({ x, y, z }: Partial<Coordinates<number>>) {
	await q.pilot.thrusters.setDirection.netSend({ direction: { x, y, z } });
}

function UntouchableLabel({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<p className={`select-none pointer-events-none absolute ${className}`}>
			{children}
		</p>
	);
}

export function Pilot({ cardLoaded }: CardProps) {
	q.pilot.stream.useDataStream({ systemId: null });

	return (
		<CircleGridStoreProvider>
			<div className="grid grid-cols-4 h-full place-content-center gap-4">
				<div className="flex flex-col justify-between">
					<ImpulseControls cardLoaded={cardLoaded} />
					<div className="flex-1 mt-2">
						<div className="flex items-stretch gap-4 ">
							<LinearJoystick
								className="h-auto"
								onDrag={({ y }) => direction({ z: -y })}
								vertical
								gamepadKey="z-thrusters"
							>
								<UntouchableLabel className="top-1">Fore</UntouchableLabel>
								<UntouchableLabel className="bottom-1">Aft</UntouchableLabel>
							</LinearJoystick>
							<Joystick
								className="w-[calc(100%-2.5rem)] h-[calc(100%-2.5rem)]"
								onDrag={({ x, y }) => direction({ y: -y, x: -x })}
								gamepadKeys={{ x: "x-thrusters", y: "y-thrusters" }}
							>
								<UntouchableLabel className="bottom-1">Down</UntouchableLabel>
								<UntouchableLabel className="top-1">Up</UntouchableLabel>
								<UntouchableLabel className="right-1">
									Starboard
								</UntouchableLabel>
								<UntouchableLabel className="left-1">Port</UntouchableLabel>
							</Joystick>
						</div>
					</div>
				</div>
				<div className="col-span-2 w-full aspect-square self-center">
					<Suspense fallback={null}>
						<GridCanvas shouldRender={cardLoaded}>
							<CircleGrid>
								<CircleGridContacts />
								<CircleGridWaypoints />
							</CircleGrid>
						</GridCanvas>
					</Suspense>
				</div>

				<div className="h-full flex flex-col justify-between gap-2">
					<LockOnButton />
					<div>
						<PilotZoomSlider />
						<CircleGridTiltButton />
					</div>
					<div className="flex-1" />
					<Joystick
						onDrag={({ x, y }) => rotation({ z: x, x: y })}
						gamepadKeys={{ x: "roll", y: "pitch" }}
					>
						<UntouchableLabel className="bottom-1">Pitch Down</UntouchableLabel>
						<UntouchableLabel className="top-1">Pitch Up</UntouchableLabel>
						<UntouchableLabel className="right-1">
							Starboard Roll
						</UntouchableLabel>
						<UntouchableLabel className="left-1">Port Roll</UntouchableLabel>
					</Joystick>
					<LinearJoystick
						onDrag={({ x }) => rotation({ y: -x })}
						gamepadKey="yaw"
					>
						<UntouchableLabel className="left-1">Port Yaw</UntouchableLabel>
						<UntouchableLabel className="right-1">
							Starboard Yaw
						</UntouchableLabel>
					</LinearJoystick>
				</div>
			</div>
		</CircleGridStoreProvider>
	);
}

function getInterstellarDistance(
	position1: { x: number; y: number; z: number; parentId: number | null },
	system1: { x: number; y: number; z: number } | null,
	position2: { x: number; y: number; z: number; parentId: number | null },
	system2: { x: number; y: number; z: number } | null,
) {
	let value = 0;
	let unit = "ly";
	if (position1.parentId === position2.parentId) {
		value = Math.hypot(
			position2.x - position1.x,
			position2.y - position1.y,
			position2.z - position1.z,
		);
		if (typeof position1.parentId === "number") unit = "km";
	} else if (system1 && system2) {
		value = Math.hypot(
			system2.x - system1.x,
			system2.y - system1.y,
			system2.z - system1.z,
		);
	} else if (!system1 && system2) {
		value = Math.hypot(
			system2.x - position1.x,
			system2.y - position1.y,
			system2.z - position1.z,
		);
	} else if (!system2 && system1) {
		value = Math.hypot(
			system1.x - position2.x,
			system1.y - position2.y,
			system1.z - position2.z,
		);
	}
	return `${value.toLocaleString()} ${unit}`;
}

const LockOnButton = () => {
	const store = useCircleGridStore();
	const waypoint = store((store) => store.facingWaypoints?.[0]);
	const [autopilot] = q.pilot.autopilot.get.useNetRequest();
	const distanceRef = useRef<HTMLSpanElement>(null);
	const [{ id, currentSystem, systemPosition }] = q.ship.player.useNetRequest();
	const { interpolate } = useLiveQuery();

	useAnimationFrame(() => {
		const shipPosition = interpolate(id);
		if (!shipPosition || !autopilot.destinationPosition) return;
		const distance = getInterstellarDistance(
			{ ...shipPosition, parentId: currentSystem },
			systemPosition,
			autopilot.destinationPosition,
			autopilot.destinationSystemPosition,
		);
		if (distanceRef.current) {
			distanceRef.current.textContent = distance;
		}
	});

	useGamepadPress("autopilot-lock-on", {
		onDown: () => {
			if (autopilot.locked) {
				q.pilot.autopilot.unlockCourse.netSend();
			} else if (typeof waypoint === "number") {
				q.pilot.autopilot.lockCourse.netSend({ waypointId: waypoint });
			}
		},
	});
	useGamepadPress("autopilot-activate", {
		onDown: () => {
			if (!autopilot.forwardAutopilot) {
				q.pilot.autopilot.activate.netSend();
			} else if (typeof waypoint === "number") {
				q.pilot.autopilot.deactivate.netSend();
			}
		},
	});

	return (
		<Fragment>
			<div className="text-center panel panel-primary h-24">
				<div>Current Course:</div>
				<div className="font-bold text-3xl my-1 ">
					{autopilot.destinationName || "No Course Set"}
				</div>
				<div>
					{autopilot.destinationName ? (
						<span>
							Distance: <span ref={distanceRef} />
						</span>
					) : (
						""
					)}
				</div>
			</div>
			{autopilot.locked ? (
				<Button
					className="w-full btn-error"
					onClick={() => q.pilot.autopilot.unlockCourse.netSend()}
				>
					Unlock Course
				</Button>
			) : (
				<Button
					className="w-full btn-warning"
					disabled={typeof waypoint !== "number"}
					onClick={() =>
						q.pilot.autopilot.lockCourse.netSend({ waypointId: waypoint })
					}
				>
					Lock On Course
				</Button>
			)}
			{!autopilot.forwardAutopilot ? (
				<Button
					className="w-full btn-error"
					disabled={!autopilot.locked}
					onClick={() => q.pilot.autopilot.activate.netSend()}
				>
					Activate Autopilot
				</Button>
			) : (
				<Button
					className="w-full btn-error"
					disabled={!autopilot.locked}
					onClick={() => q.pilot.autopilot.deactivate.netSend()}
				>
					Deactivate Autopilot
				</Button>
			)}
		</Fragment>
	);
};
