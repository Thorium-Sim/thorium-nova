import React from "react";
import {useLoader} from "react-three-fiber";
import {Color, PointLight, Texture, TextureLoader} from "three";
import {
  Lensflare,
  LensflareElement,
} from "three/examples/jsm/objects/Lensflare";

const LensFlare = () => {
  const textureFlare0Path: string = require("url:./textures/lensflare0.png");
  const textureFlare1Path: string = require("url:./textures/lensflare2.png");
  const textureFlare2Path: string = require("url:./textures/lensflare3.png");

  const lensFlare = React.useMemo(() => {
    const lensflare = new Lensflare();
    var textureLoader = new TextureLoader();

    const textureFlare0 = textureLoader.load(textureFlare0Path);
    const textureFlare1 = textureLoader.load(textureFlare1Path);
    const textureFlare2 = textureLoader.load(textureFlare2Path);

    lensflare.addElement(new LensflareElement(textureFlare0, 200, 0));
    lensflare.addElement(new LensflareElement(textureFlare1, 512, 0.01));
    lensflare.addElement(new LensflareElement(textureFlare2, 60, 0.4));
    lensflare.addElement(new LensflareElement(textureFlare2, 70, 0.7));
    lensflare.addElement(new LensflareElement(textureFlare2, 120, 0.9));
    lensflare.addElement(new LensflareElement(textureFlare2, 70, 1.0));

    return lensflare;
  }, []);
  const threeColor = React.useMemo(() => new Color("white"), []);

  const light = React.useRef<PointLight>();

  React.useEffect(() => {
    if (light.current) {
      light.current.add(lensFlare);
    }
  }, []);
  return <pointLight ref={light} intensity={2} decay={2} color={threeColor} />;
};

export default LensFlare;
