import {Centimeter, LightMinute, lightYearToLightMinute} from "./unitTypes";

/**
 * Measured in light minutes; 2000 light years in radius
 */
export const UNIVERSE_RADIUS: LightMinute = lightYearToLightMinute(2000);

/**
 * Measured in centimeters
 */
export const ASTRONOMICAL_UNIT: Centimeter = 1.496e13;
