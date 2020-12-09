import {Line, Text} from "drei";
import {FC, useMemo, useRef} from "react";
import {Object3DNode, useFrame} from "react-three-fiber";
import {EllipseCurve, Group, Mesh, OrthographicCamera} from "three";
import type {Line2} from "three/examples/jsm/lines/Line2";
import {useSpring, animated as a} from "react-spring/three";

const AnimatedText = a(Text);
const FONT_URL = require("./Teko-Light.ttf").default;

export const Circle: FC<
  {radius?: number; tilted?: boolean} & Object3DNode<any, any>
> = ({radius = 1, tilted}) => {
  const points = useMemo(() => {
    const curve = new EllipseCurve(
      0,
      0, // ax, aY
      radius,
      radius,
      0,
      Math.PI * 2,
      false,
      0
    );

    const points = curve.getPoints(100);
    return points.map(({x, y}) => [x, y, 0] as [number, number, number]);
  }, [radius]);

  const groupRef = useRef<Group>(null);
  const lineRef = useRef<Line2>(null);
  const textRef = useRef<Mesh>(null);

  const {rotation} = useSpring({
    rotation: tilted ? [Math.PI / 3, 0, 0] : [0, 0, 0],
  });

  useFrame(props => {
    const camera = props.camera as OrthographicCamera;
    const dx = (camera.right - camera.left) / (2 * camera.zoom);
    if (textRef.current) {
      if (groupRef.current) {
        if (dx > radius * 4) {
          groupRef.current.visible = false;
        } else if (dx < radius) {
          groupRef.current.visible = false;
        } else {
          const opacity = Math.max(
            0,
            Math.min(1, Math.abs(1 - (dx - radius * 3) / radius))
          );
          if (!Array.isArray(textRef.current.material)) {
            textRef.current.material.transparent = true;
            textRef.current.material.opacity = opacity;
          }
          if (lineRef.current) {
            lineRef.current.material.transparent = true;
            lineRef.current.material.opacity = opacity;
          }
          groupRef.current.visible = true;
        }
      }
      textRef.current.scale.setScalar(dx);
    }
  });
  return (
    <group ref={groupRef}>
      <AnimatedText
        color="#333" // default
        anchorX="center" // default
        anchorY="bottom-baseline" // default
        fontSize={0.075}
        font={FONT_URL}
        position={[0, radius * 1.03, 0]}
        rotation={(rotation as unknown) as [number, number, number]}
        ref={textRef}
      >
        {radius < 1
          ? (radius * 1000).toLocaleString() + "m"
          : radius.toLocaleString() + "km"}
      </AnimatedText>
      <Line
        ref={lineRef}
        points={points} // Array of points
        color={0x666666} // Default
        lineWidth={1} // In pixels (default)
      />
    </group>
  );
};
