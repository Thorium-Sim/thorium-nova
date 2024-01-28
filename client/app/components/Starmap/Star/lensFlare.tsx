import React from "react";
import {TextureLoader} from "three";
import {Lensflare, LensflareElement} from "three-stdlib";

// TODO: Create a secondary render loop just for the lens flare.
// https://github.com/pmndrs/react-three-fiber/blob/master/recipes.md#heads-up-display-rendering-multiple-scenes
import textureFlare0Path from "./textures/lensflare0.png";
import textureFlare1Path from "./textures/lensflare2.png";
import textureFlare2Path from "./textures/lensflare3.png";
const LensFlare = () => {
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
  return <primitive object={lensFlare} />;
};

export default LensFlare;
