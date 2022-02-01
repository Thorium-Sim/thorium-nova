interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

export type Kilometer = Flavor<number, "kilometer">;
export type Meter = Flavor<number, "meter">;
export type Centimeter = Flavor<number, "centimeter">;

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
