import type { Kilometer } from "@server/utils/unitTypes";
import { Quaternion } from "three";

export const zoomMax: Kilometer = 11000;
export const zoomMin: Kilometer = 0.011;

export const cameraQuaternionMultiplier = new Quaternion(
	Math.SQRT1_2,
	0,
	0,
	Math.SQRT1_2,
);
export const forwardQuaternion = new Quaternion(0, 1, 0, 0);
