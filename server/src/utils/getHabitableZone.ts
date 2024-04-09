// Habitable Zone Calculation
// This was created based on information from this page
// https://cosmicreflections.skythisweek.info/2017/06/08/habitable-zones/
// min and max are in kilometers
// radius is the radius of the star in solar radii
// temperature is in kelvin
// 5777 is the temperature of Sol

import {
	astronomicalUnitToKilometer,
	type Kelvin,
	type SolarRadius,
} from "./unitTypes";

export default function getHabitableZone(
	radius: SolarRadius,
	temperature: Kelvin,
) {
	const min = astronomicalUnitToKilometer(
		0.7 * radius * (temperature / 5777) ** 2,
	);
	const max = astronomicalUnitToKilometer(
		1.5 * radius * (temperature / 5777) ** 2,
	);
	return { min, max };
}
