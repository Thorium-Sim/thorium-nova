import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { q } from "@thorium/context/AppContext";
import { computeDockedTransform } from "@thorium/utils/starmap/docking";
import { Euler, Quaternion, Vector3 } from "three";

export default function ThreeD() {
	const ship1Position = new Vector3(-2, 0, 0);
	const ship1Orientation = new Quaternion().setFromEuler(new Euler(0.5, Math.PI / 2, -Math.PI));
	const ship2Orientation = new Quaternion().setFromEuler(new Euler(0, Math.PI, Math.PI / 2));
	const [ship] = q.plugin.ship.get.useNetRequest({
		pluginId: "Thorium Default",
		shipId: "Astra Frigate",
	});
	const model = useGLTF(ship.assets.model, false);

	const { position, rotation } = computeDockedTransform({
		hostPosition: ship1Position,
		hostRotation: ship1Orientation,
		hostPortPos: ship.dockingPorts[0].position,
		hostPortDir: [
			ship.dockingPorts[0].orientation.x,
			ship.dockingPorts[0].orientation.y,
			ship.dockingPorts[0].orientation.z,
		],
		hostScale: 1,
		guestPortPos: ship.dockingPorts[0].position,
		guestPortDir: [
			ship.dockingPorts[0].orientation.x,
			ship.dockingPorts[0].orientation.y,
			ship.dockingPorts[0].orientation.z,
		],
		guestScale: 1,
		currentGuestRotation: ship2Orientation,
	});
	return (
		<div className="absolute inset-0 bg-black">
			<Canvas
				camera={{
					near: 0.1,
					far: 10000,
					position: [0, 0, 5],
				}}
			>
				<ambientLight intensity={1} />
				<directionalLight color="white" position={[2, 3, 5]} />
				<OrbitControls />

				<primitive
					object={model.scene.clone()}
					position={ship1Position}
					quaternion={ship1Orientation}
				/>
				<primitive object={model.scene.clone()} position={position} quaternion={rotation} />
			</Canvas>
		</div>
	);
}

// function Sprite() {
// 	const spriteMap = useShipSprite(
// 		"http://localhost:3000/plugins/Thorium%20Default/ships/Astra%20Frigate/assets/logo.svg",
// 	);
// 	return (
// 		<sprite position={[1, 1, 0]}>
// 			<spriteMaterial attach="material" map={spriteMap} color={0x888888} sizeAttenuation={false} />
// 		</sprite>
// 	);
// }
