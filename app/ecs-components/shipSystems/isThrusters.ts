import z from "zod";

const coordinates = z
	.object({
		x: z.number().default(0),
		y: z.number().default(0),
		z: z.number().default(0),
	})
	.default({});

export const isThrusters = z
	.object({
		/** Whether the thrusters are currently thrusting */
		thrusting: z.boolean().default(false),
		/** The currently applied direction thruster vector in m/s */
		direction: coordinates,
		/** The maximum speed which can be applied by direction thrusters in m/s */
		directionMaxSpeed: z.number().default(1),
		/** The thrust applied by direction thrusters in kilo-newtons, which affects how fast the ship accelerates based on the mass of the ship. */
		directionThrust: z.number().default(12500),
		/** The current direction thruster impulse vector*/
		directionImpulse: z
			.object({
				x: z.number().default(0),
				y: z.number().default(0),
				z: z.number().default(0),
			})
			.default({}),

		/** The current vector of rotation being applied. */
		rotationDelta: coordinates,
		/** The max rotation speed in rotations per minute. */
		rotationMaxSpeed: z.number().default(5),
		/** The thrust applied by rotation thrusters in kilo-newtons, which affects how fast the rotation accelerates based on the mass of the ship. */
		rotationThrust: z.number().default(12500),
		/** Rotation velocity scalar used by the autopilot */
		autoRotationVelocity: z.number().default(1),
		/** The current direction thruster impulse vector*/
		rotationImpulse: z
			.object({
				x: z.number().default(0),
				y: z.number().default(0),
				z: z.number().default(0),
			})
			.default({}),
	})
	.default({});
