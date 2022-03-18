export interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

export type Kilometer = Flavor<number, "kilometer">;
export type Meter = Flavor<number, "meter">;
export type Centimeter = Flavor<number, "centimeter">;

export type KilometerPerSecond = Flavor<number, "kilometerPerSecond">;
export type KilometerPerSecondSquared = Flavor<
  number,
  "kilometerPerSecondSquared"
>;
export type KiloNewtons = Flavor<number, "kiloNewtons">;

/**
 * Distance compared to the radius of the sun eg. 1 solar radius = the radius of the sun
 */
export type SolarRadius = Flavor<number, "solarRadius">;

export type AstronomicalUnit = Flavor<number, "astronomicalUnit">;
export type LightYear = Flavor<number, "lightYear">;
export type LightMinute = Flavor<number, "lightMinute">;

export function lightMinuteToLightYear(len: LightMinute) {
  return len / (60 * 24 * 365.25);
}
export function lightYearToLightMinute(len: LightYear) {
  return len * (60 * 24 * 365.25);
}

export type Kilograms = Flavor<number, "kilograms">;
/**
 * Mass compared to the sun eg. 1 solar mass = the mass of the sun
 */
export type SolarMass = Flavor<number, "solarMass">;
/**
 * Mass compared to the Earth eg. 1 terran mass = the mass of the Earth
 */
export type TerranMass = Flavor<number, "terranMass">;
/**
 * Force of gravity at the surface compared to Earth's
 */
export type GForce = Flavor<number, "gForce">;
export type Kelvin = Flavor<number, "kelvin">;

export type Year = Flavor<number, "year">;

export type Degree = Flavor<number, "degree">;
export type Radian = Flavor<number, "radian">;

export function degToRad(degree: Degree): Radian {
  return (degree * Math.PI) / 180;
}
