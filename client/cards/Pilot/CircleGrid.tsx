import {useSystemShipsStore} from "client/components/viewscreen/useSystemShips";
import {Fragment, memo, useRef} from "react";
import {useFrame} from "react-three-fiber";
import {Group, OrthographicCamera, Quaternion} from "three";
import {Circle} from "./DistanceCircle";
import {Arrow} from "./PlayerArrow";
import {useSpring} from "react-spring/three";
import {PilotContacts} from "./PilotContacts";

const cameraQuaternionMultiplier = new Quaternion(
  0.7071067811865476,
  0,
  0,
  0.7071067811865476
);
const forwardQuaternion = new Quaternion(0, 1, 0, 0);
export const CircleGrid = memo(
  ({
    tilt,
    playerShipId,
    zoomMax,
  }: {
    tilt: number;
    playerShipId: string;
    zoomMax: number;
  }) => {
    const circleGroup = useRef<Group>(null);
    const tiltRef = useRef(0);
    useSpring({
      tilt,
      onChange: value => (tiltRef.current = value.tilt),
    });
    useFrame(props => {
      const playerShip = useSystemShipsStore.getState()[playerShipId];
      if (playerShip?.position && playerShip?.rotation && circleGroup.current) {
        circleGroup.current.position.set(0, 0, 0);
        circleGroup.current.quaternion
          .set(
            playerShip.rotation.x,
            playerShip.rotation.y,
            playerShip.rotation.z,
            playerShip.rotation.w
          )
          .multiply(forwardQuaternion);

        const camera = props.camera as OrthographicCamera;
        const untiltedQuaternion = circleGroup.current.quaternion.clone();
        const tiltedQuaternion = untiltedQuaternion
          .clone()
          .multiply(cameraQuaternionMultiplier);
        camera.position
          .set(0, zoomMax, 0)
          .applyQuaternion(
            untiltedQuaternion.slerp(tiltedQuaternion, tiltRef.current)
          );
        camera.quaternion.set(
          playerShip.rotation.x,
          playerShip.rotation.y,
          playerShip.rotation.z,
          playerShip.rotation.w
        );
        camera.rotateX(-Math.PI / 2 - (Math.PI / 2) * tiltRef.current);
        camera.rotateZ(Math.PI);
      }
    });
    return (
      <Fragment>
        <group rotation={[0, 0, 0]}>
          <group ref={circleGroup}>
            <Circle radius={10000} />
            <Circle radius={7500} />
            <Circle radius={5000} />
            <Circle radius={2500} />
            <Circle radius={1800} />
            <Circle radius={1000} />
            <Circle radius={750} />
            <Circle radius={500} />
            <Circle radius={250} />
            <Circle radius={180} />
            <Circle radius={100} />
            <Circle radius={75} />
            <Circle radius={50} />
            <Circle radius={25} />
            <Circle radius={18} />
            <Circle radius={10} />
            <Circle radius={7.5} />
            <Circle radius={5.0} />
            <Circle radius={2.5} />
            <Circle radius={1.8} />
            <Circle />
            <Circle radius={0.75} />
            <Circle radius={0.5} />
            <Circle radius={0.25} />
            <Circle radius={0.18} />
            <Circle radius={0.1} />
            <Circle radius={0.075} />
            <Circle radius={0.05} />
            <Circle radius={0.025} />
            <Circle radius={0.018} />
            <Circle radius={0.01} />

            <Arrow />
          </group>
          <PilotContacts tilted={tilt > 0} />
        </group>
      </Fragment>
    );
  }
);
