import {Kilometer} from "server/src/utils/unitTypes";
import {Quaternion} from "three";

export const zoomMax: Kilometer = 11000;
export const zoomMin: Kilometer = 0.011;

export const cameraQuaternionMultiplier = new Quaternion(
  0.7071067811865476,
  0,
  0,
  0.7071067811865476
);
export const forwardQuaternion = new Quaternion(0, 1, 0, 0);
