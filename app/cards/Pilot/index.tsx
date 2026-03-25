import type { CardProps } from "@thorium/cards/CardProps";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import { toast } from "@thorium/context/ToastContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useGamepadPress } from "@thorium/hooks/useGamepadStore";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Joystick, LinearJoystick } from "@thorium/ui/Joystick";
import { ShipWarning, useShipWarnings } from "@thorium/ui/ShipWarning";
import { useServerAlerts } from "@thorium/ui/useServerAlerts";
import { SystemStabilityError } from "@thorium/utils/live-query/client/SystemStabilityError";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import type { Coordinates } from "@thorium/utils/unitTypes";
import type { MutableRefObject, ReactNode } from "react";
import { Fragment, Suspense, useCallback, useEffect, useRef } from "react";
import { CircleGrid, CircleGridTiltButton, GridCanvas } from "./CircleGrid";
import { ImpulseControls } from "./ImpulseControls";
import { CircleGridContacts, CircleGridWaypoints } from "./PilotContacts";
import { PilotZoomSlider } from "./PilotZoomSlider";
import { CircleGridStoreProvider } from "./useCircleGridStore";

async function rotation({
	shipId,
	x,
	y,
	z,
}: { shipId: number } & Partial<Coordinates<number>>) {
	try {
		await q.pilot.thrusters.setRotationDelta.netSend({
			shipId,
			rotation: { x, y, z },
		});
	} catch (err) {
		if (err instanceof SystemStabilityError) {
			toast({
				title: "Thrusters command failed",
				body: err.message,
				color: "error",
			});
		}
	}
}
async function direction({
	shipId,
	x,
	y,
	z,
}: { shipId: number } & Partial<Coordinates<number>>) {
	try {
		await q.pilot.thrusters.setDirection.netSend({
			shipId,
			direction: { x, y, z },
		});
	} catch (err) {
		if (err instanceof SystemStabilityError) {
			toast({
				title: "Thrusters command failed",
				body: err.message,
				color: "error",
			});
		}
	}
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
	const { shipId } = useStation();
	q.pilot.stream.useDataStream({ systemId: null, shipId });
	const [targetedContact] = q.targeting.targetedContact.useNetRequest({
		shipId,
	});
	const [autopilot] = q.pilot.autopilot.get.useNetRequest({ shipId });

	const {
		showWarning,
		dismissWarning,
		displayedWarning,
		isEntering,
		isExiting,
		onEntryComplete,
		onExitComplete,
	} = useShipWarnings();

	// Bridge server-side ship alerts (collision warnings, etc.) into the warning system
	useServerAlerts(shipId, showWarning, dismissWarning);

	// Detect when the course is unlocked server-side while forward autopilot was off
	// (e.g., ship overshot the final waypoint with manual engine controls).
	// userUnlockedRef distinguishes user-initiated unlocks (button/gamepad) from
	// server-initiated unlocks (overshoot detection) so only the latter shows a warning.
	const userUnlockedRef = useRef(false);
	const prevLockedRef = useRef(autopilot.locked);
	const prevForwardAutopilotRef = useRef(!!autopilot.forwardAutopilot);
	useEffect(() => {
		if (
			prevLockedRef.current &&
			!autopilot.locked &&
			!prevForwardAutopilotRef.current
		) {
			if (userUnlockedRef.current) {
				userUnlockedRef.current = false;
			} else {
				showWarning({
					id: "course-lock-released",
					priority: 5,
					content: "Course Lock Released",
					duration: 5000,
				});
			}
		}
		prevLockedRef.current = autopilot.locked;
		prevForwardAutopilotRef.current = !!autopilot.forwardAutopilot;
	}, [autopilot.locked, autopilot.forwardAutopilot, showWarning]);

	const autopilotActiveRef = useRef(false);
	const prevAutopilotActiveRef = useRef(false);
	autopilotActiveRef.current = !!autopilot.forwardAutopilot;
	const alertActiveRef = useRef(false);

	// Reset the guard when autopilot is re-engaged so the warning can trigger again
	if (autopilotActiveRef.current && !prevAutopilotActiveRef.current) {
		alertActiveRef.current = false;
	}
	prevAutopilotActiveRef.current = autopilotActiveRef.current;

	const onFlightControlInteraction = useCallback(() => {
		if (autopilotActiveRef.current && !alertActiveRef.current) {
			alertActiveRef.current = true;
			// Server-side handlers deactivate forwardAutopilot; just show the warning here.
			showWarning({
				id: "autopilot-deactivated",
				priority: 5,
				content: "Autopilot Deactivated",
				duration: 5000,
			});
		}
	}, [showWarning]);

	return (
		<CircleGridStoreProvider>
			<div className="grid grid-cols-4 grid-rows-1 h-full place-content-center gap-4">
				<div className="flex flex-col justify-between">
					<ImpulseControls
						cardLoaded={cardLoaded}
						onFlightControlInteraction={onFlightControlInteraction}
						forwardAutopilot={!!autopilot.forwardAutopilot}
					/>
					<div className="flex-1 mt-2">
						<div className="flex items-stretch gap-4 direction-thrusters">
							<LinearJoystick
								id="direction-foreaft"
								className="h-auto"
								onDrag={({ y }) => {
									onFlightControlInteraction();
									direction({ shipId, z: -y });
								}}
								vertical
								gamepadKey="z-thrusters"
							>
								<UntouchableLabel className="top-1">Fore</UntouchableLabel>
								<UntouchableLabel className="bottom-1">Aft</UntouchableLabel>
							</LinearJoystick>
							<Joystick
								id="direction"
								className="w-[calc(100%-2.5rem)] h-[calc(100%-2.5rem)]"
								onDrag={({ x, y }) => {
									onFlightControlInteraction();
									direction({ shipId, y: -y, x: -x });
								}}
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
				<div className="col-span-2 w-full aspect-square self-center pilot-radar">
					<Suspense fallback={null}>
						<GridCanvas shouldRender={cardLoaded}>
							<CircleGrid>
								<CircleGridContacts targetedContactId={targetedContact?.id} />
								<CircleGridWaypoints />
							</CircleGrid>
						</GridCanvas>
					</Suspense>
				</div>

				<div className="h-full flex flex-col justify-between gap-2">
					<LockOnButton userUnlockedRef={userUnlockedRef} />
					<div>
						<div className="pilot-slider">
							<PilotZoomSlider />
						</div>
						<div className="pilot-tilt">
							<CircleGridTiltButton />
						</div>
					</div>
					<div className="flex-1" />
					<div className="flex flex-col gap-2 rotation-thrusters">
						<Joystick
							id="rotation"
							onDrag={({ x, y }) => {
								onFlightControlInteraction();
								rotation({ shipId, z: x, x: y });
							}}
							gamepadKeys={{ x: "roll", y: "pitch" }}
						>
							<UntouchableLabel className="bottom-1">
								Pitch Down
							</UntouchableLabel>
							<UntouchableLabel className="top-1">Pitch Up</UntouchableLabel>
							<UntouchableLabel className="right-1">
								Starboard Roll
							</UntouchableLabel>
							<UntouchableLabel className="left-1">Port Roll</UntouchableLabel>
						</Joystick>
						<LinearJoystick
							id="rotation-yaw"
							onDrag={({ x }) => {
								onFlightControlInteraction();
								rotation({ shipId, y: -x });
							}}
							gamepadKey="yaw"
						>
							<UntouchableLabel className="left-1">Port Yaw</UntouchableLabel>
							<UntouchableLabel className="right-1">
								Starboard Yaw
							</UntouchableLabel>
						</LinearJoystick>
					</div>
				</div>
			</div>
			<ShipWarning
				warning={displayedWarning}
				isEntering={isEntering}
				isExiting={isExiting}
				onEntryComplete={onEntryComplete}
				onExitComplete={onExitComplete}
			/>
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
	return `${value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unit}`;
}

const LockOnButton = ({
	userUnlockedRef,
}: {
	userUnlockedRef: MutableRefObject<boolean>;
}) => {
	const { cardLoaded } = useCardContext();
	const {
		shipId,
		ship: { currentSystem, systemPosition },
	} = useStation();
	const [autopilot] = q.pilot.autopilot.get.useNetRequest({ shipId });
	const waypoint = autopilot.facingWaypointIds[0] ?? undefined;
	const distanceRef = useRef<HTMLSpanElement>(null);

	const { interpolate } = useLiveQuery();

	useAnimationFrame(() => {
		const shipPosition = interpolate(shipId);
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
	}, cardLoaded);

	useGamepadPress("autopilot-lock-on", {
		onDown: () => {
			if (autopilot.locked) {
				userUnlockedRef.current = true;
				q.pilot.autopilot.unlockCourse.netSend({ shipId });
			} else if (typeof waypoint === "number") {
				q.pilot.autopilot.lockCourse.netSend({ shipId, waypointId: waypoint });
			}
		},
	});
	useGamepadPress("autopilot-activate", {
		onDown: () => {
			if (!autopilot.forwardAutopilot) {
				q.pilot.autopilot.activate.netSend({ shipId });
			} else if (typeof waypoint === "number") {
				q.pilot.autopilot.deactivate.netSend({ shipId });
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
				<div className="tabular-nums">
					{autopilot.destinationName ? (
						<span>
							Distance: <span ref={distanceRef} />
						</span>
					) : (
						""
					)}
				</div>
			</div>

			<div className="flex gap-2">
				{autopilot.locked ? (
					<Button
						className="flex-auto btn-error"
						onClick={() => {
							userUnlockedRef.current = true;
							q.pilot.autopilot.unlockCourse.netSend({ shipId });
						}}
					>
						Unlock Course
					</Button>
				) : (
					<Button
						className={cn(
							"flex-auto lock-on-course",
							typeof waypoint === "number" ? "btn-warning" : "btn-disabled",
						)}
						disabled={typeof waypoint !== "number"}
						onClick={() =>
							q.pilot.autopilot.lockCourse.netSend({
								waypointId: waypoint,
								shipId,
							})
						}
					>
						Lock On Course
					</Button>
				)}
				{!autopilot.forwardAutopilot ? (
					<Button
						className={cn(
							"flex-auto activate-autopilot",
							autopilot.locked ? "btn-warning" : "btn-disabled",
						)}
						disabled={!autopilot.locked}
						onClick={() => q.pilot.autopilot.activate.netSend({ shipId })}
					>
						Activate Autopilot
					</Button>
				) : (
					<Button
						className="flex-auto btn-error deactivate-autopilot"
						disabled={!autopilot.locked}
						onClick={() => q.pilot.autopilot.deactivate.netSend({ shipId })}
					>
						Deactivate Autopilot
					</Button>
				)}
			</div>
		</Fragment>
	);
};
