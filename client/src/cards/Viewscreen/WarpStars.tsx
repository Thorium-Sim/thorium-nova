import {useFrame} from "@react-three/fiber";
import Star from "client/src/components/Starmap/Star/StarMesh";
import {useThorium} from "client/src/context/ThoriumContext";
import {useNetRequest} from "client/src/context/useNetRequest";
import {getSphericalPositionWithBias} from "client/src/utils/getSphericalPositionWithBias";
import {randomPointInSphere} from "client/src/utils/randomPointInSphere";
import {memo, useMemo} from "react";
import {
  Color,
  CylinderBufferGeometry,
  DoubleSide,
  Euler,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  Side,
  Vector3,
} from "three";
import {useForwardVelocity} from "../Pilot/ImpulseControls";

const STAR_COUNT = 5000;
const FORWARD_DISTANCE = 10000;
const LY_IN_KM = 9460730472580.8;

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

export const WarpStars = () => {
  const {id: shipId, currentSystem} = useNetRequest("pilotPlayerShip");
  const isInSystem = typeof currentSystem === "number";
  const mesh = useMemo(() => {
    const geometry = new CylinderBufferGeometry(1, 0, 100, 16, 16);
    const material = new MeshBasicMaterial({
      color: new Color(`hsl(0,0%,100%)`),
      // emissive: new Color(`hsl(230, 100%, 70%)`),
      transparent: true,
      opacity: 0.9,
      side: DoubleSide,
    });
    const mesh = new InstancedMesh(geometry, material, STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      StarPosition.set(...randomPointInSphere(FORWARD_DISTANCE));
      matrix.compose(StarPosition, StarQuaternion, StarScale);
      mesh.setMatrixAt(i, matrix);
    }
    return mesh;
  }, []);
  const {interstellarCruisingSpeed, solarCruisingSpeed} =
    useNetRequest("pilotWarpEngines");

  const getForwardVelocity = useForwardVelocity();
  const {interpolate} = useThorium();
  useFrame(() => {
    const entity = interpolate(shipId);
    if (!entity) return;

    const rotation = entity.r || {x: 0, y: 0, z: 0, w: 1};
    let [forwardVelocity] = getForwardVelocity();

    const going = forwardVelocity > 20000;
    let maxPossibleVelocity = isInSystem
      ? solarCruisingSpeed
      : interstellarCruisingSpeed;

    let velocity =
      (forwardVelocity / maxPossibleVelocity) * 50 + (going ? 4 : 0);

    if (rotation) {
      RotateQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
    if (mesh.position && entity) {
      shipPosition.set(entity.x, entity.y, entity.z);
      movement
        .subVectors(shipPosition, mesh.position)
        .negate()

        .divideScalar(
          maxPossibleVelocity / (isInSystem ? 500000 : LY_IN_KM * 5000)
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
      StarScale.setY((velocity + 0.01) / 10);
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

  return <primitive object={mesh} />;
};
