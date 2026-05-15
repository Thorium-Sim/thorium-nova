import { lightYearToLightMinute, type LightMinute } from "@thorium/utils/unitTypes";

import { randomFromList } from "./operations/randomFromList";

/**
 * Measured in light minutes; 2000 light years in radius
 */
export const UNIVERSE_RADIUS: LightMinute = lightYearToLightMinute(2000);

export const greekLetters = [
	"Alpha",
	"Beta",
	"Gamma",
	"Delta",
	"Zeta",
	"Eta",
	"Iota",
	"Kappa",
	"Lambda",
	"Rho",
	"Sigma",
	"Tau",
	"Omega",
	"Epsilon",
	"Omicron",
	"Theta",
	"Phi",
];
export function randomCode() {
	const codeWords2 = [
		"Ansible",
		"Cyber",
		"Matrix",
		"Naidon",
		"Skadov",
		"Memory",
		"Faraday",
		"Bernal",
		"Dyson",
		"Protocol",
		"Vector",
		"Analog",
		"Digital",
		"Buffer",
		"Cache",
		"Crypto",
		"Fragment",
		"System",
		"Duplex",
		"Threading",
		"Hyper",
		"Interlace",
		"Progressive",
		"Simplex",
		"Multiplex",
		"Syntax",
		"Token",
	];
	return `${randomFromList(greekLetters)}-${Math.floor(
		Math.random() * 999,
	)}-${randomFromList(codeWords2)}`;
}
