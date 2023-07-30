import z from "zod";

// TODO April 27, 2022: Add the necessary sound effects
export const isImpulseEngines = z
  .object({
    /** The max speed at full impulse in km/s. */
    cruisingSpeed: z.number().default(1500),
    /** The max speed at emergency impulse in km/s. */
    emergencySpeed: z.number().default(2000),
    /** The force in kilo-newtons which impulse engines apply. */
    thrust: z.number().default(12500),
    /** The desired speed of the ship in km/s. */
    targetSpeed: z.number().default(0),
    /** The forward acceleration of the ship in km/s^2. */
    forwardAcceleration: z.number().default(0),
    /** The forward velocity of the ship in km/s. */
    forwardVelocity: z.number().default(0),
    /** The measured velocity of the ship in km/s. */
    measuredVelocity: z.number().default(0),
  })
  .default({});
