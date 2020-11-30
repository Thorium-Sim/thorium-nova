import {Object3D} from "three";

export class GLTFLoader {
  load(path, cb) {
    return cb({
      scene: new Object3D(),
    });
  }
}
