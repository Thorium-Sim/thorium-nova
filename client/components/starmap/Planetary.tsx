import React from "react";
import {useThree} from "react-three-fiber";
import {BufferGeometry, EllipseCurve, LineBasicMaterial, Vector3} from "three";
import Star from "./star";

const OrbitLine: React.FC<{radiusX: number; radiusY: number}> = ({
  radiusX,
  radiusY,
}) => {
  const geometry = React.useMemo(() => {
    const curve = new EllipseCurve(
      0,
      0, // ax, aY
      radiusX,
      radiusY, // xRadius, yRadius
      0,
      Math.PI * 2,
      false,
      0
    );

    const points = curve.getPoints(100);

    const geometry = new BufferGeometry().setFromPoints(points);
    return geometry;
  }, []);

  return (
    <line geometry={geometry} rotation={[Math.PI / 2, 0, 0]}>
      <lineBasicMaterial
        attach="material"
        color={0x0088ff}
        linewidth={10}
        linecap={"round"}
        linejoin={"round"}
      />
    </line>
  );
};

const Planet: React.FC<{satellites?: PlanetOrbitProps[]}> = ({
  satellites,
  ...props
}) => {
  return (
    <group {...props}>
      <mesh scale={[5, 5, 5]}>
        <sphereBufferGeometry args={[1, 32, 32]} attach="geometry" />
        <meshPhysicalMaterial color={0x0088ff} attach="material" />
      </mesh>
      {satellites?.map((s, i) => (
        <PlanetOrbit key={`orbit-${i}`} {...s} />
      ))}
    </group>
  );
};

//gravitational constant to measure the force with masses in kg and radii in meters N(m/kg)^2
export const G = 6.6742e-11;
//astronomical unit in km
export const AU = 149597870;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

interface PlanetOrbitProps {
  radius: number;
  eccentricity: number;
  orbitalArc: number;
  orbitalInclination: number;
}
const PlanetOrbit: React.FC<
  PlanetOrbitProps & {
    satellites?: PlanetOrbitProps[];
  }
> = ({radius, eccentricity, orbitalArc, orbitalInclination, satellites}) => {
  const radiusY = radius - radius * eccentricity;
  const planetX = radius * Math.cos(DEG_TO_RAD * orbitalArc);
  const planetY = radiusY * Math.sin(DEG_TO_RAD * orbitalArc);
  return (
    <group rotation={[0, 0, orbitalInclination * DEG_TO_RAD]}>
      <OrbitLine radiusX={radius} radiusY={radiusY} />
      <Planet position={[planetX, 0, planetY]} satellites={satellites} />
    </group>
  );
};
// 1 unit = 1 million km
const Planetary: React.FC<{universeId: string; systemId: string}> = ({
  universeId,
  systemId,
}) => {
  const {camera} = useThree();

  React.useEffect(() => {
    camera.position.set(0, 200, 500);
    camera.lookAt(new Vector3(0, 0, 0));
  }, []);

  return (
    <>
      <Star scale={[20, 20, 20]} />
      <PlanetOrbit
        radius={47}
        eccentricity={0}
        orbitalArc={0}
        orbitalInclination={0}
      />
      <PlanetOrbit
        radius={67}
        eccentricity={0}
        orbitalArc={126}
        orbitalInclination={0}
      />
      <PlanetOrbit
        radius={151}
        eccentricity={0}
        orbitalArc={74}
        orbitalInclination={0}
        satellites={[
          {
            radius: 10,
            eccentricity: 0.0549,
            orbitalInclination: 5.145,
            orbitalArc: 0,
          },
        ]}
      />
      <PlanetOrbit
        radius={207}
        eccentricity={0}
        orbitalArc={241}
        orbitalInclination={0}
      />
      <PlanetOrbit
        radius={770}
        eccentricity={0}
        orbitalArc={241}
        orbitalInclination={0}
      />
      <PlanetOrbit
        radius={1494}
        eccentricity={0}
        orbitalArc={241}
        orbitalInclination={0}
      />
      <PlanetOrbit
        radius={2960}
        eccentricity={0}
        orbitalArc={241}
        orbitalInclination={0}
      />
      <PlanetOrbit
        radius={4476}
        eccentricity={0}
        orbitalArc={241}
        orbitalInclination={0}
      />
      <PlanetOrbit
        radius={5900}
        eccentricity={0.2488}
        orbitalArc={241}
        orbitalInclination={11.88}
      />
    </>
  );
};
export default Planetary;
