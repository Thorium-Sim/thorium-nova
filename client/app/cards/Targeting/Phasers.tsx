import { q } from "@client/context/AppContext";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import { Edges, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { isPointWithinCone } from "@server/utils/isPointWithinCone";
import { degToRad } from "@server/utils/unitTypes";
import { useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "@thorium/live-query/client";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import Slider from "@thorium/ui/Slider";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, Euler, type Group, Quaternion, Vector3 } from "three";
import type { Line2 } from "three-stdlib";

export function PhaserArcs() {
	const [phasers] = q.targeting.phasers.list.useNetRequest();
	return (
		<>
			{phasers.map((phaser) => (
				<ConeVisualization key={phaser.id} {...phaser} />
			))}
		</>
	);
}

const up = new Vector3(0, 1, 0);
const cameraProjection = new Vector3();
const planeVector = new Vector3(0, 1, 0);
const directionVector = new Vector3();
function ConeVisualization({
	arc,
	heading,
	pitch,
	maxArc,
	maxRange,
}: {
	arc: number;
	heading: number;
	pitch: number;
	maxArc: number;
	maxRange: number;
}) {
	const [height, radius, angle, rotation] = useMemo(() => {
		const range = maxRange - maxRange * (arc / (maxArc + 1));

		const rotation = new Euler(
			pitch * (Math.PI / 180),
			heading * (Math.PI / 180),
			0,
		);
		const angle = arc * (Math.PI / 180);

		const radius = range * Math.tan(angle / 2);

		return [range, radius, angle, rotation];
	}, [arc, maxArc, pitch, heading, maxRange]);

	const lineLength = Math.sqrt(height ** 2 + radius ** 2);
	const coneRef = useRef<Line2>(null);
	const groupRef = useRef<Group>(null);

	useFrame(({ camera }) => {
		cameraProjection
			.copy(camera.position)
			.projectOnPlane(planeVector.set(0, 1, 0))
			.normalize();

		const angle =
			Math.atan2(cameraProjection.x, cameraProjection.y) + rotation.y;
		if (coneRef.current) {
			coneRef.current.rotation.y = angle;
		}

		groupRef.current?.quaternion.setFromUnitVectors(
			up,
			directionVector.set(0, 0, -1).applyEuler(rotation).normalize().negate(),
		);
	});
	return (
		<group ref={groupRef}>
			<mesh position={[0, -height / 2, 0]}>
				<coneGeometry args={[radius, height, 32, 1, true]} />
				<meshStandardMaterial
					depthTest={false}
					opacity={0}
					transparent
					side={DoubleSide}
				/>
				<Edges threshold={30} scale={1} renderOrder={1000} color="orange">
					<meshBasicMaterial
						transparent
						opacity={0.4}
						color="orange"
						depthTest={false}
					/>
				</Edges>
			</mesh>
			<Line
				ref={coneRef}
				rotation={[0, 0, -Math.PI / 2 - angle / 2]}
				points={[
					[lineLength, 0, 0],
					[0, 0, 0],
					[lineLength * Math.cos(angle), lineLength * Math.sin(angle), 0],
				]}
				color="orange"
				transparent
				opacity={0.4}
				depthTest={false}
			/>
		</group>
	);
}

export function BeamVisualization() {
	const [firingPhasers] = q.targeting.phasers.firing.useNetRequest();
	const [{ id: playerId }] = q.ship.player.useNetRequest();

	const { interpolate } = useLiveQuery();
	const lineRef = useRef<Line2>(null);

	useFrame(() => {
		if (!lineRef.current) return;
		const points: number[] = [];
		const player = interpolate(playerId);
		if (!player) return;
		firingPhasers.forEach((phaser) => {
			const ship = interpolate(phaser.shipId);
			const target = interpolate(phaser.targetId);
			if (!ship || !target) return;
			points.push(ship.x - player.x, ship.y - player.y, ship.z - player.z);
			points.push(
				target.x - player.x,
				target.y - player.y,
				target.z - player.z,
			);
		});
		if (points.length === 0) {
			lineRef.current.visible = false;
		} else {
			lineRef.current.visible = true;
			lineRef.current?.geometry.setPositions(points);
			lineRef.current.material.linewidth =
				5 * Math.max(...firingPhasers.map((p) => p.firePercent));
		}
	});

	return (
		<Line
			ref={lineRef}
			points={[0, 0, 0]}
			segments
			color="orange"
			lineWidth={5}
			depthTest={false}
		/>
	);
}

export function Phasers() {
	const [phasers] = q.targeting.phasers.list.useNetRequest();
	return (
		<div className="flex flex-col gap-4">
			{phasers.map((phaser) => (
				<PhaserControl key={phaser.id} {...phaser} />
			))}
		</div>
	);
}

const targetVector = new Vector3();
const playerVector = new Vector3();
const rotationQuaternion = new Quaternion();
const direction = new Vector3();
function PhaserControl({
	id,
	arc,
	maxArc,
	maxRange,
	nominalHeat,
	maxSafeHeat,
	heading,
	pitch,
}: {
	id: number;
	arc: number;
	maxArc: number;
	maxRange: number;
	nominalHeat: number;
	maxSafeHeat: number;
	heading: number;
	pitch: number;
}) {
	const { interpolate } = useLiveQuery();
	const chargeRef = useRef<HTMLProgressElement>(null);
	const heatRef = useRef<HTMLProgressElement>(null);
	const [targetedContact] = q.targeting.targetedContact.useNetRequest();
	const [{ id: playerId }] = q.ship.player.useNetRequest();
	const buttonContainerRef = useRef<HTMLDivElement>(null);
	useAnimationFrame(() => {
		const values = interpolate(id);
		if (!values) return;
		const { z: heat, x: charge } = values;
		if (chargeRef.current) {
			chargeRef.current.value = charge;
		}
		if (heatRef.current) {
			// Scale the heat value
			heatRef.current.value =
				(heat - nominalHeat) / (maxSafeHeat - nominalHeat);
		}
		// Check if the target is in range
		let inCone = false;
		if (targetedContact) {
			const target = interpolate(targetedContact.id);
			const player = interpolate(playerId);
			if (target && player) {
				targetVector.set(target.x, target.y, target.z);
				playerVector.set(player.x, player.y, player.z);

				const range = maxRange - maxRange * (arc / (maxArc + 1));
				rotationQuaternion.set(player.r.x, player.r.y, player.r.z, player.r.w);
				// Turn the ship rotation quaternion into a vector
				direction.set(0, 0, 1).applyQuaternion(rotationQuaternion);
				// Add the Phaser rotation to the ship rotation
				direction.applyAxisAngle(new Vector3(0, 1, 0), degToRad(heading));
				direction.applyAxisAngle(new Vector3(1, 0, 0), degToRad(pitch));
				direction.multiplyScalar(range);
				inCone = isPointWithinCone(targetVector, {
					apex: playerVector,
					angle: degToRad(arc),
					direction,
				});
			}
		}
		if (inCone) {
			buttonContainerRef.current?.childNodes.forEach((child) => {
				if (child instanceof HTMLButtonElement) {
					child.disabled = false;
					child.classList.remove("grayscale");
				}
			});
		} else {
			buttonContainerRef.current?.childNodes.forEach((child) => {
				if (child instanceof HTMLButtonElement) {
					child.disabled = true;
					child.classList.add("grayscale");
				}
			});
		}
	});

	const cache = useQueryClient();
	const getFirePhasers = (firePercent: number) => {
		return async function firePhasers() {
			await q.targeting.phasers.fire.netSend({ phaserId: id, firePercent });
			document.addEventListener(
				"pointerup",
				() => {
					q.targeting.phasers.fire.netSend({ phaserId: id, firePercent: 0 });
				},
				{ once: true },
			);
		};
	};

	useEffect(() => {
		return () => {
			q.targeting.phasers.fire.netSend({ phaserId: id, firePercent: 0 });
		};
	}, [id]);

	return (
		<div className="grid grid-cols-[auto_1fr]">
			<Icon name="atomic-slashes" size="sm" />
			<progress className="progress progress-warning " ref={chargeRef} />
			<Icon name="flame" size="sm" />
			<progress className="progress progress-error" ref={heatRef} />
			<Slider
				aria-label="Arc"
				minValue={0}
				maxValue={maxArc}
				step={1}
				value={arc}
				className="slider w-full col-span-2 "
				onChange={(val: number | number[]) => {
					// Manually update the local cache with the arc value so it looks really smooth
					cache.setQueryData(
						q.targeting.phasers.list.getQueryKey(),
						(data: any[]) => {
							if (!data) return data;
							return data.map((phaser) => {
								if (phaser.id === id) {
									return { ...phaser, arc: val as number };
								}
								return phaser;
							});
						},
					);
					q.targeting.phasers.setArc.netSend({
						phaserId: id,
						arc: val as number,
					});
				}}
			/>
			<div
				className="col-span-2 flex gap-1 btn-container"
				ref={buttonContainerRef}
			>
				<Button
					className="btn-xs btn-warning mt-2"
					onPointerDown={getFirePhasers(0.25)}
				>
					25%
				</Button>
				<Button
					className="btn-xs btn-warning mt-2"
					onPointerDown={getFirePhasers(0.5)}
				>
					50%
				</Button>
				<Button
					className="btn-xs btn-warning mt-2"
					onPointerDown={getFirePhasers(0.75)}
				>
					75%
				</Button>
				<Button
					className="flex-1 btn-xs btn-error mt-2"
					onPointerDown={getFirePhasers(1)}
				>
					Full
				</Button>
			</div>
		</div>
	);
}
