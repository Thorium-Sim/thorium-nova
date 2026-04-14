import { Line, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Arrow } from "@thorium/cards/Legacy/Thrusters/Arrow";
import { DamageOverlay } from "@thorium/components/DamageOverlay";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import { useStation } from "@thorium/routes/station/useStation";
import { Joystick, LinearJoystick } from "@thorium/ui/Joystick";
import { degToRad, type Coordinates } from "@thorium/utils/unitTypes";
import {
	Suspense,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	type ReactNode,
	type Ref,
} from "react";
import { Color, type Group, Mesh, MeshBasicMaterial } from "three";

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

export function LegacyThrusters() {
	const { shipId } = useStation();
	const updateShipViewRef = useRef<ShipViewRef>(null);

	const [thrusters] = q.legacy.thrusters.get.useNetRequest(
		{ shipId },
		{
			callback(data) {
				updateShipViewRef.current?.({
					rotation: [
						degToRad(data.rotation.pitch * -1),
						degToRad(data.rotation.yaw * -1 + 180),
						degToRad(data.rotation.roll),
					],
					direction: data.direction,
				});
			},
		},
	);

	useEffect(() => {
		return () => {
			rotation({ shipId, x: 0, y: 0, z: 0 });
			direction({ shipId, x: 0, y: 0, z: 0 });
		};
	}, [shipId]);

	return (
		<div className="grid grid-cols-7 grid-rows-3 items-center h-full gap-4">
			<DamageOverlay systemId={thrusters.id} />
			<div className="col-span-2 row-span-3">
				<p className="text-center mb-2">Direction</p>
				<div className="flex flex-col gap-4">
					<Joystick
						id="direction"
						className="w-full aspect-square grow-0 shrink-0"
						onDrag={({ x, y }) => direction({ shipId, z: -y, x: -x })}
						gamepadKeys={{ x: "x-thrusters", y: "y-thrusters" }}
					>
						<UntouchableLabel className="bottom-1">Aft</UntouchableLabel>
						<UntouchableLabel className="top-1">Fore</UntouchableLabel>
						<UntouchableLabel className="right-1">Starboard</UntouchableLabel>
						<UntouchableLabel className="left-1">Port</UntouchableLabel>
					</Joystick>
					<LinearJoystick
						id="direction-updown"
						className="w-full"
						onDrag={({ x }) => direction({ shipId, y: -x })}
						gamepadKey="z-thrusters"
					>
						<UntouchableLabel className="right-1">Up</UntouchableLabel>
						<UntouchableLabel className="left-1">Down</UntouchableLabel>
					</LinearJoystick>
				</div>
			</div>
			<div className="col-span-3 row-span-2 h-full">
				<Suspense>
					<ShipView ref={updateShipViewRef} />
				</Suspense>
			</div>

			<div className="col-span-2 row-span-3">
				<p className="text-center mb-2">Rotation</p>

				<div className="flex flex-col gap-4">
					<Joystick
						id="rotation"
						className="w-full aspect-square grow-0 shrink-0"
						onDrag={({ x, y }) => rotation({ shipId, z: x, x: y })}
						gamepadKeys={{ x: "x-thrusters", y: "y-thrusters" }}
					>
						<UntouchableLabel className="bottom-1">Pitch Down</UntouchableLabel>
						<UntouchableLabel className="top-1">Pitch Up</UntouchableLabel>
						<UntouchableLabel className="right-1">Roll Right</UntouchableLabel>
						<UntouchableLabel className="left-1">Roll Left</UntouchableLabel>
					</Joystick>
					<LinearJoystick
						id="rotate-yaw"
						className="w-full"
						onDrag={({ x }) => {
							rotation({ shipId, y: x });
						}}
						gamepadKey="z-thrusters"
					>
						<UntouchableLabel className="right-1">
							Yaw Starboard
						</UntouchableLabel>
						<UntouchableLabel className="left-1">Yaw Port</UntouchableLabel>
					</LinearJoystick>
				</div>
			</div>
			<RotationIndicator
				rotation={thrusters.rotation.yaw}
				required={thrusters.requiredRotation.yaw}
			>
				Yaw
			</RotationIndicator>
			<RotationIndicator
				rotation={thrusters.rotation.pitch}
				required={thrusters.requiredRotation.pitch}
			>
				Pitch
			</RotationIndicator>
			<RotationIndicator
				rotation={thrusters.rotation.roll}
				required={thrusters.requiredRotation.roll}
			>
				Roll
			</RotationIndicator>
		</div>
	);
}

function RotationIndicator({
	children,
	rotation,
	required,
}: {
	children: ReactNode;
	rotation: number;
	required: number;
}) {
	return (
		<div>
			<div className="bg-gray-500 rounded-full aspect-square w-full border-2 border-gray-400 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] relative">
				<div className="text-center absolute top-0 left-1/2 -translate-x-1/2">
					0
				</div>
				<div className="text-center absolute right-0 top-1/2 -translate-y-1/2">
					90
				</div>
				<div className="text-center absolute bottom-0 left-1/2 -translate-x-1/2">
					180
				</div>
				<div className="text-center absolute left-0 top-1/2 -translate-y-1/2">
					270
				</div>
				<div
					className="w-1 h-1/3 top-1/2 rounded-t bg-yellow-300 left-1/2 absolute origin-bottom"
					style={{
						transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
					}}
				/>
				<div
					className="w-0.5 h-1/4 top-1/2 -translate-y-full rounded-t bg-red-500 left-1/2 -translate-x-1/2 absolute origin-bottom"
					style={{
						transform: `translate(-50%, -100%) rotate(${required}deg)`,
					}}
				/>
			</div>
			<p className="text-center" data-testid={`indicator-${children}`}>
				{children}: {Math.round(rotation)}˚
			</p>
		</div>
	);
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

type ShipViewRef = (params: {
	rotation?: [number, number, number];
	direction?: { x: number; y: number; z: number };
}) => void;

function ShipView({ ref }: { ref: Ref<ShipViewRef> }) {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();
	const [ship] = q.ship.get.useNetRequest({ shipId });
	const groupRef = useRef<Group>(null);

	const upRef = useRef<Mesh>(null);
	const downRef = useRef<Mesh>(null);
	const foreRef = useRef<Mesh>(null);
	const aftRef = useRef<Mesh>(null);
	const portRef = useRef<Mesh>(null);
	const starboardRef = useRef<Mesh>(null);

	useImperativeHandle(ref, () => ({ rotation, direction }) => {
		if (rotation) {
			groupRef.current?.rotation.set(...rotation);
		}
		if (direction) {
			if (upRef.current && !Array.isArray(upRef.current.material)) {
				upRef.current.material.opacity = -direction.y;
			}
			if (downRef.current && !Array.isArray(downRef.current.material)) {
				downRef.current.material.opacity = direction.y;
			}
			if (portRef.current && !Array.isArray(portRef.current.material)) {
				portRef.current.material.opacity = direction.x;
			}
			if (
				starboardRef.current &&
				!Array.isArray(starboardRef.current.material)
			) {
				starboardRef.current.material.opacity = -direction.x;
			}
			if (foreRef.current && !Array.isArray(foreRef.current.material)) {
				foreRef.current.material.opacity = direction.z;
			}
			if (aftRef.current && !Array.isArray(aftRef.current.material)) {
				aftRef.current.material.opacity = -direction.z;
			}
		}
	});

	const model = useGLTF(ship?.assets?.model || "", false);

	if (!ship?.isShip) return null;

	model.scene.traverse((object) => {
		if (object instanceof Mesh) {
			if (Array.isArray(object.material)) {
				for (const mat of object.material) {
					mat.dispose();
				}
			} else {
				object.material.dispose();
			}
			const mat = new MeshBasicMaterial();
			mat.color = new Color(0x0088ff);
			mat.wireframe = true;
			object.material = mat;
		}
	});

	return (
		<Canvas
			className="h-full"
			camera={{ position: [0, 2, 6], near: 0.01, far: 10, fov: 30 }}
			frameloop={cardLoaded ? "always" : "never"}
		>
			<group ref={groupRef}>
				<Arrow
					ref={portRef}
					position={[1.5, 0, 0]}
					rotation={[Math.PI / 2, 0, 0]}
				/>
				<Arrow
					ref={starboardRef}
					position={[-1.5, 0, 0]}
					rotation={[Math.PI / 2, Math.PI, 0]}
				/>
				<Arrow
					ref={upRef}
					position={[0, 1.5, 0]}
					rotation={[0, 0, Math.PI / 2]}
				/>
				<Arrow
					ref={downRef}
					position={[0, -1.5, 0]}
					rotation={[0, 0, -Math.PI / 2]}
				/>
				<Arrow
					ref={foreRef}
					position={[0, 0, 1.5]}
					rotation={[Math.PI / 2, 0, Math.PI / 2]}
				/>
				<Arrow
					ref={aftRef}
					position={[0, 0, -1.5]}
					rotation={[Math.PI / 2, 0, -Math.PI / 2]}
				/>
				<primitive object={model.scene} rotation={[Math.PI / 2, Math.PI, 0]} />
				<Circle color={0xff0000} />
				<Circle color={0x00ff00} rotation={[0, Math.PI / 2, 0]} />
				<Circle color={0x0000ff} rotation={[Math.PI / 2, 0, 0]} />
			</group>
		</Canvas>
	);
}

function Circle({
	color,
	rotation,
}: {
	color: number;
	rotation?: [x: number, y: number, z: number];
}) {
	const points = useMemo(() => {
		const points: [number, number, number][] = [];
		const scale = 0.5;
		for (let i = 0; i < 32; i++) {
			const theta = ((2 * Math.PI) / 32) * i + 0.1;
			const x1 = (scale + 1) * Math.cos(theta);
			const x2 = (scale + 0.9) * Math.cos(theta);
			const y1 = (scale + 1) * Math.sin(theta);
			const y2 = (scale + 0.9) * Math.sin(theta);
			points.push([x1, y1, 0]);
			points.push([x2, y2, 0]);
		}

		return points;
	}, []);

	return <Line segments points={points} color={color} rotation={rotation} />;
}
