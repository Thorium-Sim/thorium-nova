import {Object3D} from "three";

export class GLTFLoader {
  constructor() {}
  load(path, cb) {
    return cb({
      scene: new Object3D(),
    });
  }
}
