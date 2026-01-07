import Button from "@thorium/ui/Button";
import { Fragment, Suspense, useRef, useState } from "react";
import { GridCanvas, CircleGrid, CircleGridTiltButton } from "./CircleGrid";
import { PilotZoomSlider } from "./PilotZoomSlider";
import {
	CircleGridStoreProvider,
	useCircleGridStore,
} from "./useCircleGridStore";
import { ImpulseControls } from "./ImpulseControls";
import { Joystick, LinearJoystick } from "@thorium/ui/Joystick";
import type { ReactNode } from "react";
import type { Coordinates } from "@thorium/utils/unitTypes";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { clientId, q } from "@thorium/context/AppContext";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { useGamepadPress } from "@thorium/hooks/useGamepadStore";
import { CircleGridContacts, CircleGridWaypoints } from "./PilotContacts";
import type { CardProps } from "@thorium/cards/CardProps";
import { useStation } from "@thorium/routes/station/useStation";
import { useCardContext } from "@thorium/context/CardContext";
import {
	Dialog,
	DialogTrigger,
	ModalOverlay,
	Modal,
	Button as RAButton,
} from "react-aria-components";
import { cn } from "@thorium/utils/cn";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { Navigation } from "@thorium/cards/Navigation";
import useEventListener from "@thorium/hooks/useEventListener";

async function rotation({
	shipId,
	x,
	y,
	z,
}: { shipId: number } & Partial<Coordinates<number>>) {
	await q.pilot.thrusters.setRotationDelta.netSend({
		shipId,
		rotation: { x, y, z },
	});
}
async function direction({
	shipId,
	x,
	y,
	z,
}: { shipId: number } & Partial<Coordinates<number>>) {
	await q.pilot.thrusters.setDirection.netSend({
		shipId,
		direction: { x, y, z },
	});
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

	return (
		<CircleGridStoreProvider>
			<div className="grid grid-cols-4 grid-rows-1 h-full place-content-center gap-4">
				<div className="flex flex-col justify-between">
					<ImpulseControls cardLoaded={cardLoaded} />
					<div className="flex-1 mt-2">
						<div className="flex items-stretch gap-4 direction-thrusters">
							<LinearJoystick
								id="direction-foreaft"
								className="h-auto"
								onDrag={({ y }) => direction({ shipId, z: -y })}
								vertical
								gamepadKey="z-thrusters"
							>
								<UntouchableLabel className="top-1">Fore</UntouchableLabel>
								<UntouchableLabel className="bottom-1">Aft</UntouchableLabel>
							</LinearJoystick>
							<Joystick
								id="direction"
								className="w-[calc(100%-2.5rem)] h-[calc(100%-2.5rem)]"
								onDrag={({ x, y }) => direction({ shipId, y: -y, x: -x })}
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
					<LockOnButton />
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
							onDrag={({ x, y }) => rotation({ shipId, z: x, x: y })}
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
							onDrag={({ x }) => rotation({ shipId, y: -x })}
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

const LockOnButton = () => {
	const { cardLoaded } = useCardContext();
	const {
		shipId,
		ship: { currentSystem, systemPosition },
	} = useStation();
	const store = useCircleGridStore();
	const waypoint = store((store) => store.facingWaypoints?.[0]);
	const [autopilot] = q.pilot.autopilot.get.useNetRequest({ shipId });
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

	const [isNavOpen, setIsNavOpenState] = useState(false);
	function setIsNavOpen(open: boolean) {
		q.thorium.genericEvent.netSend({
			clientId,
			eventName: "navigation-open",
			properties: `${open}`,
		});
		setIsNavOpenState(open);
	}
	useEventListener("waypoint-activated", () => {
		console.log("Waypoint Activated Event");
		setIsNavOpen(false);
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
			<DialogTrigger isOpen={isNavOpen} onOpenChange={setIsNavOpen}>
				<RAButton className="btn w-full btn-info set-course">
					Set Course
				</RAButton>

				<ModalOverlay
					isDismissable
					className={cn(
						"fixed inset-0 z-20 overflow-y-auto bg-black/40 flex min-h-full w-full items-center justify-center p-4 backdrop-blur overflow-hidden",
						"transition-all duration-200 data-[entering]:opacity-0 data-[exiting]:opacity-0",
					)}
				>
					<Modal
						className={cn(
							"theme-container transition-opacity duration-200 data-[entering]:opacity-0 data-[exiting]:opacity-0",
						)}
					>
						<Dialog className="z-30 relative outline-none w-[90vw] h-[90vh] inline-block align-bottom rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle m:w-full mx-8">
							<Navigation cardLoaded />
							<div className="absolute bottom-4 left-1/2 -translate-x-1/2">
								<RAButton
									slot="close"
									className="btn btn-error clear-waypoint"
									onPress={() => {
										q.waypoints.deactivate.netSend({ shipId });
									}}
								>
									Clear Waypoint
								</RAButton>
							</div>
						</Dialog>
					</Modal>
				</ModalOverlay>
			</DialogTrigger>
			<div className="flex gap-2">
				{autopilot.locked ? (
					<Button
						className="w-full btn-error"
						onClick={() => q.pilot.autopilot.unlockCourse.netSend({ shipId })}
					>
						Unlock Course
					</Button>
				) : (
					<Button
						className="w-full btn-warning lock-on-course"
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
						className="w-full btn-error activate-autopilot"
						disabled={!autopilot.locked}
						onClick={() => q.pilot.autopilot.activate.netSend({ shipId })}
					>
						Activate Autopilot
					</Button>
				) : (
					<Button
						className="w-full btn-error"
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
