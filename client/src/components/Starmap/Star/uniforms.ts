import {Color, Texture} from "three";

export default function getUniforms({
  map,
  color1 = 0x58b1f1,
  color2 = 0xf6fcff,
  flare1 = 0.3,
  flare2 = 0.4,
  flare3 = 0.1,
  flare4 = 0.7,
  flare5 = 1,
  flare6 = 0.1,
}: {
  map: Texture;
  color1?: number | Color;
  color2?: number | Color;
  flare1?: number;
  flare2?: number;
  flare3?: number;
  flare4?: number;
  flare5?: number;
  flare6?: number;
}) {
  return {
    map: {type: "t", value: map},
    time: {
      type: "f",
      value: 0,
    },
    frametime: {
      type: "f",
      value: 0,
    },
    resolution: {
      type: "v2",
      value: {
        x: 100,
        y: 100,
      },
    },
    speed: {
      type: "f",
      value: 1,
    },
    poi: {
      type: "v2",
      value: {
        x: 0,
        y: 0,
      },
    },
    poi3D: {
      type: "v3",
      value: {
        x: 0,
        y: 0,
        z: 0,
      },
    },
    camPos: {
      type: "v3",
      value: {
        x: 0,
        y: 0,
        z: 0,
      },
    },
    camZ: {
      type: "v3",
      value: {
        x: 0,
        y: 0,
        z: 0,
      },
    },
    wpoi3D: {
      type: "v3",
      value: {
        x: 0,
        y: 0,
        z: 0,
      },
    },
    wcenter: {
      type: "v3",
      value: {
        x: 0,
        y: 0,
        z: 0,
      },
    },
    start: {
      type: "f",
      value: 5,
    },
    end: {
      type: "f",
      value: 5,
    },
    iterations: {
      type: "i",
      value: 0,
    },

    color1: {
      type: "c",
      value: new Color(color1),
    },
    color2: {
      type: "c",
      value: new Color(color2),
    },
    flare1: {
      type: "f",
      value: flare1,
    },
    flare2: {
      type: "f",
      value: flare2,
    },
    flare3: {
      type: "f",
      value: flare3,
    },
    flare4: {
      type: "f",
      value: flare4,
    },
    flare5: {
      type: "f",
      value: flare5,
    },
    flare6: {
      type: "f",
      value: flare6,
    },
    sphere: {
      type: "f",
      value: 1,
    },
    textureBlend: {
      type: "f",
      value: 1,
    },
    corona: {
      type: "f",
      value: 1,
    },
    glow: {
      type: "f",
      value: 0.5,
    },
    alpha: {
      type: "f",
      value: 1,
    },
    rotation1: {
      type: "f",
      value: 0.6,
    },
    rotation2: {
      type: "f",
      value: 0.6,
    },
  };
}
