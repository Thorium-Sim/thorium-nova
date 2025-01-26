import type { Color } from "three";
import type { LinearSpline } from "./LinearSpline";

export interface Angle {
	longitude: number;
	latitude: number;
}
interface Spin {
	x: number;
	y: number;
	z: number;
}
export interface CellProps {
	birthRatePerSecond?: number;
	birthRateVariance?: number;
	initialCount?: number;
	lifeInSeconds?: number;
	lifeVariance?: number;
	speed?: number;
	speedVariance?: number;
	colorOverLife?: LinearSpline<Color>;
	scale?: number;
	scaleVariance?: number;
	scalePercentOverLife?: LinearSpline<number>;
	angle?: Partial<Angle>;
	angleVariance?: Partial<Angle>;
	spin?: Partial<Spin>;
	spinVariance?: Partial<Spin>;
	attachToEmitter?: boolean;
	// TODO
	alignAngleWithVelocity?: boolean;

	rng?: () => number;
}
