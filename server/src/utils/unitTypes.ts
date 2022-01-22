interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

export type Kilometer = Flavor<number, "kilometer">;
export type Meter = Flavor<number, "meter">;
export type Centimeter = Flavor<number, "centimeter">;
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

export type Kelvin = Flavor<number, "kelvin">;

export type Year = Flavor<number, "year">;

export type Degree = Flavor<number, "degree">;
export type Radian = Flavor<number, "radian">;

export function degToRad(degree: Degree): Radian {
  return (degree * Math.PI) / 180;
}
