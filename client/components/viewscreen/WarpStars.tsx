import {usePlayerWarpSubscription} from "client/generated/graphql";
import * as React from "react";

import {useFrame} from "react-three-fiber";
import {
  Color,
  CylinderBufferGeometry,
  Euler,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from "three";
import {randomPointInSphere} from "./getRandomPointInSphere";
import {getSphericalPositionWithBias} from "./getSphericalPositionWithBias";
import {useInterstellarShipsStore} from "./useInterstellarShips";
import {
  useForwardVelocityStore,
  usePlayerForwardVelocity,
} from "./usePlayerForwardVelocity";
import {useSystemShipsStore} from "./useSystemShips";

const STAR_COUNT = 10000;
const FORWARD_DISTANCE = 5000;
const LY_IN_KM = 9_460_730_472_580.8;

const StarPosition = new Vector3();
const StarQuaternion = new Quaternion().setFromEuler(
  new Euler(Math.PI / 2, 0, 0)
);
const StarScale = new Vector3(2, 1, 2);
const matrix = new Matrix4();
const StarColor = new Color();
const ZeroVector = new Vector3();
const starRotationQuaternion = new Quaternion().setFromEuler(
  new Euler(-Math.PI / 2, 0, 0)
);

const RotateQuaternion = new Quaternion();
const shipPosition = new Vector3();
const movement = new Vector3();
const WarpStars = React.memo(
  ({isInSystem, shipId}: {isInSystem: boolean; shipId: string}) => {
    const mesh = React.useMemo(() => {
      const geometry = new CylinderBufferGeometry(1, 0, 100, 16, 16);
      const material = new MeshBasicMaterial({
        color: new Color(`hsl(0,0%,30%)`),
        // emissive: new Color(`hsl(230, 100%, 70%)`),
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new InstancedMesh(geometry, material, STAR_COUNT);
      for (let i = 0; i < STAR_COUNT; i++) {
        StarPosition.set(...randomPointInSphere(FORWARD_DISTANCE));
        matrix.compose(StarPosition, StarQuaternion, StarScale);
        mesh.setMatrixAt(i, matrix);
      }
      return mesh;
    }, []);
    const {data: warpData} = usePlayerWarpSubscription();
    const {interstellarCruisingSpeed, planetaryCruisingSpeed} = warpData
      ?.warpEnginesOutfit?.warpEngines || {
      interstellarCruisingSpeed: 599600000000,
      planetaryCruisingSpeed: 29980000,
    };

    usePlayerForwardVelocity();
    useFrame(({camera}) => {
      const entity = (isInSystem
        ? useSystemShipsStore
        : useInterstellarShipsStore
      ).getState()[shipId];
      if (!entity) return;
      const rotation = entity.rotation;
      const {forwardVelocity} = useForwardVelocityStore.getState();
      const going = forwardVelocity > 20000;
      const maxPossibleVelocity = isInSystem
        ? planetaryCruisingSpeed
        : interstellarCruisingSpeed;
      const velocity =
        (forwardVelocity / maxPossibleVelocity) * 50 + (going ? 4 : 0);
      if (rotation) {
        RotateQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      }
      if (mesh.position && entity.position) {
        shipPosition.set(
          entity.position.x,
          entity.position.y,
          entity.position.z
        );
        movement
          .subVectors(shipPosition, mesh.position)
          .negate()

          .divideScalar(
            maxPossibleVelocity / (isInSystem ? 5000 : LY_IN_KM * 5000)
          );
        mesh.position.copy(shipPosition);
      }
      for (let i = 0; i < STAR_COUNT; i++) {
        mesh.getMatrixAt(i, matrix);
        matrix.decompose(StarPosition, StarQuaternion, StarScale);
        StarPosition.add(movement);
        if (StarPosition.distanceTo(ZeroVector) > FORWARD_DISTANCE + 1) {
          StarPosition.set(...getSphericalPositionWithBias(FORWARD_DISTANCE));
        }
        const distance = StarPosition.distanceTo(ZeroVector);
        StarScale.setX(Math.min(2, Math.max(0, distance / 100)));
        StarScale.setZ(Math.min(2, Math.max(0, distance / 100)));
        StarScale.setY((velocity + 0.01) / 50);
        StarQuaternion.copy(RotateQuaternion).multiply(starRotationQuaternion);
        matrix.compose(StarPosition, StarQuaternion, StarScale);
        mesh.setMatrixAt(i, matrix);
        const a = 0.184;
        const hue = Math.round(
          Math.min(360, Math.max(230, a * StarPosition.z + 230))
        );
        StarColor.setHSL(hue / 360, 1, 0.9);
        mesh.setColorAt(i, StarColor);
      }
      if (!Array.isArray(mesh.material)) {
        mesh.material.opacity = Math.min(
          0.9,
          Math.max(0, (forwardVelocity / maxPossibleVelocity) * 50)
        );

        if (mesh.material.opacity > 0.1) {
          mesh.visible = true;
        } else {
          mesh.visible = false;
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    });

    if (!shipId) return null;
    return <primitive object={mesh} />;
  }
);

export default WarpStars;
