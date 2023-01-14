export interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

export type Kilometer = Flavor<number, "kilometer">;
export type Meter = Flavor<number, "meter">;
export type Centimeter = Flavor<number, "centimeter">;

export type MetersPerSecond = Flavor<number, "metersPerSecond">;
export type KilometerPerSecond = Flavor<number, "kilometerPerSecond">;
export type MetersPerSecondSquared = Flavor<number, "metersPerSecondSquared">;
export type KilometerPerSecondSquared = Flavor<
  number,
  "kilometerPerSecondSquared"
>;
export type KiloNewtons = Flavor<number, "kiloNewtons">;

export const KM_TO_LY = 1 / 9460730777119.56;
export const KM_TO_LM = lightYearToLightMinute(KM_TO_LY);
export const M_TO_KM = 1 / 1000;

/**
 * Distance compared to the radius of the sun eg. 1 solar radius = the radius of the sun
 */
export type SolarRadius = Flavor<number, "solarRadius">;

export function solarRadiusToKilometers(solarRadius: SolarRadius): Kilometer {
  return solarRadius * 695_700;
}
export type AstronomicalUnit = Flavor<number, "astronomicalUnit">;
export type LightYear = Flavor<number, "lightYear">;
export type LightMinute = Flavor<number, "lightMinute">;

export function astronomicalUnitToKilometer(au: AstronomicalUnit): Kilometer {
  return au * 149_597_870;
}

export function lightMinuteToLightYear(len: LightMinute) {
  return len / (60 * 24 * 365.25);
}
export function lightYearToLightMinute(len: LightYear) {
  return len * (60 * 24 * 365.25);
}
export function kilometerToLightMinute(len: Kilometer) {
  return len * 5.559e-8;
}

export type CubicMeter = Flavor<number, "cubicMeter">;

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
export type RotationsPerMinute = Flavor<number, "rotationsPerMinute">;
export type RadiansPerSecond = Flavor<number, "radiansPerSecond">;

export function degToRad(degree: Degree): Radian {
  return (degree * Math.PI) / 180;
}

export class Coordinates<T extends number> {
  x: T = 0 as T;
  y: T = 0 as T;
  z: T = 0 as T;
}

export type KiloWattHour = Flavor<number, "kilowatthour">;
export type KiloWatt = Flavor<number, "kilowatt">;
