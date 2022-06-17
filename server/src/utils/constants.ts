import {Centimeter, LightMinute, lightYearToLightMinute} from "./unitTypes";

/**
 * Measured in light minutes; 2000 light years in radius
 */
export const UNIVERSE_RADIUS: LightMinute = lightYearToLightMinute(2000);

/**
 * Measured in centimeters
 */
export const ASTRONOMICAL_UNIT: Centimeter = 1.496e13;

/**
 * How frequently the server sends high-frequency updates to the client
 */
export const SERVER_FPS = 10;
