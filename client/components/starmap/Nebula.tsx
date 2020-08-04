import React from "react";
import nebulaGenerator from "./generateNebulaMap";
import {
  MeshBasicMaterial,
  CanvasTexture,
  BackSide,
  sRGBEncoding,
  Color,
  CubeTexture,
} from "three";
import useImage from "../../helpers/hooks/useImage";
const radius = 1000000;

interface Textures {
  front: any;
  back: any;
  top: any;
  bottom: any;
  left: any;
  right: any;
}

function drawIndividual(source: any, targetId: string, bg: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 2048;
  var ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.save();
  if (targetId === "texture-bottom") {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(source, -1024, -1024, 2048, 2048);
    ctx.globalCompositeOperation = "lighten";
    ctx.drawImage(bg, -1024, -1024, 2048, 2048);
  } else if (targetId === "texture-top") {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-90 * Math.PI) / 180);
    ctx.drawImage(source, -1024, -1024, 2048, 2048);
    ctx.globalCompositeOperation = "lighten";
    ctx.drawImage(bg, -1024, -1024, 2048, 2048);
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(source, 0, 0, 2048, 2048);
    ctx.globalCompositeOperation = "lighten";
    ctx.drawImage(bg, 0, 0, 2048, 2048);
  }
  ctx.restore();
  return canvas;
}

export function generateMaterials(skyboxKey: string, bg: HTMLImageElement) {
  const textures = skyboxKey
    ? (nebulaGenerator(skyboxKey || "c") as Textures)
    : generateBlank();
  const maps: HTMLCanvasElement[] = [];

  maps.push(drawIndividual(textures.front, "texture-front", bg));
  maps.push(drawIndividual(textures.back, "texture-back", bg));
  maps.push(drawIndividual(textures.top, "texture-top", bg));
  maps.push(drawIndividual(textures.bottom, "texture-bottom", bg));
  maps.push(drawIndividual(textures.left, "texture-left", bg));
  maps.push(drawIndividual(textures.right, "texture-right", bg));

  const tx = maps.map(m => new CanvasTexture(m));
  const mats = tx.map(m => {
    m.encoding = sRGBEncoding;
    return new MeshBasicMaterial({
      map: m,
      side: BackSide,
      color: new Color("#fff"),
      depthTest: false,
      depthWrite: false,
    });
  });
  return mats;
}
function generateBlank() {
  return {
    front: document.createElement("canvas"),
    back: document.createElement("canvas"),
    top: document.createElement("canvas"),
    bottom: document.createElement("canvas"),
    left: document.createElement("canvas"),
    right: document.createElement("canvas"),
  };
}

const Nebula = React.memo<{skyboxKey: string}>(function Nebula({skyboxKey}) {
  const starsImage = useImage(require("url:./stars.jpg"));
  const mats = React.useMemo(() => {
    return generateMaterials(skyboxKey, starsImage);
  }, [starsImage, skyboxKey]);

  const geo = React.useRef();
  return (
    <group renderOrder={-100}>
      <mesh scale={[radius, radius, radius]} material={mats} visible={true}>
        <boxGeometry ref={geo} args={[1, 1, 1]} attach="geometry" />
      </mesh>
    </group>
  );
});

export default Nebula;
