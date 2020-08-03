import {Camera, Scene} from "three";
import {generateScene} from "../generateGltfImage";
describe("generateGLTFImage", () => {
  it("should generate a scene", async () => {
    // This is a weak test to make sure that something is happening
    const url = `data:application/octet-stream;base64,Z`;
    const {scene, camera} = await generateScene(url);
    expect(scene).toBeInstanceOf(Scene);
    expect(camera).toBeInstanceOf(Camera);
  });
});
