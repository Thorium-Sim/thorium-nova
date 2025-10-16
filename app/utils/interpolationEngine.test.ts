import { interpolate } from "@thorium/utils/interpolationEngine";
import { createRNG } from "@thorium/utils/rng";
import { expect, test } from "vitest";

test("it should interpolate a plain string", () => {
	expect(interpolate("this is a plain string")).toEqual(
		"this is a plain string",
	);
});
test("it should interpolate a variable into a string", () => {
	expect(interpolate("this is a {type} string", { type: "boring" })).toEqual(
		"this is a boring string",
	);
});
test("it should interpolate a variable regardless of the whitespace", () => {
	expect(
		interpolate(
			`this is a {
    type} string`,
			{ type: "boring" },
		),
	).toEqual("this is a boring string");
});
test("it should interpolate a ternary condition", () => {
	expect(
		interpolate("this is a [cool|awesome|not awesome] string", { cool: true }),
	).toEqual("this is a awesome string");
	expect(
		interpolate("this is a [cool|awesome|not awesome] string", { cool: false }),
	).toEqual("this is a not awesome string");
});
test("it should interpolate a variable switch", () => {
	const testString = `this is a [damageType|Electrical:electrical subsystems|Radiation:radiative coating|default:structure] string`;
	expect(interpolate(testString, { damageType: "Electrical" })).toEqual(
		"this is a electrical subsystems string",
	);
	expect(interpolate(testString, { damageType: "Radiation" })).toEqual(
		"this is a radiative coating string",
	);
	expect(interpolate(testString, { damageType: "Whatever" })).toEqual(
		"this is a structure string",
	);
});
test("it should set variables inside a variable switch", () => {
	const testString =
		"The [damageType|Electrical:electrical subsystems;verb=have|Radiation:radiation coating;verb=has|default:structure;verb=has] of the {systemName} {verb} sustained damage";
	expect(
		interpolate(testString, {
			damageType: "Electrical",
			systemName: "Shields",
		}),
	).toEqual("The electrical subsystems of the Shields have sustained damage");
	expect(
		interpolate(testString, { damageType: "Radiation", systemName: "Shields" }),
	).toEqual("The radiation coating of the Shields has sustained damage");
	expect(
		interpolate(testString, { damageType: "Whatever", systemName: "Shields" }),
	).toEqual("The structure of the Shields has sustained damage");
});
test("it should randomly choose between listed strings", () => {
	const rng = createRNG("test");
	expect(
		interpolate(
			`The code is {~Alpha,Beta,Gamma,Delta,Zeta,Lambda,Omicron}`,
			{},
			rng,
		),
	).toEqual("The code is Lambda");
	expect(
		interpolate(
			`The code is {~Alpha,Beta,Gamma,Delta,Zeta,Lambda,Omicron} {~Alfa,Bravo,Charlie,Delta,Echo,Foxtrot}`,
			{},
			rng,
		),
	).toEqual("The code is Beta Foxtrot");
});
test("it should work with a RANDOM function", () => {
	const rng = createRNG("test");

	expect(interpolate(`The code is RANDOM(100,999)`, {}, rng)).toEqual(
		"The code is 851",
	);
	expect(interpolate(`The code is RANDOM(100,999)`, {}, rng)).toEqual(
		"The code is 327",
	);
});
test("it should work with a CAPITALIZE function", () => {
	expect(
		interpolate("The CAPITALIZE({type}) need some work.", {
			type: "warpEngines",
		}),
	).toEqual("The Warp Engines need some work.");
});
test("it should work with a LOWERCASE function", () => {
	expect(
		interpolate("The LOWERCASE({type}) need some work.", { type: "SHIElDS" }),
	).toEqual("The shields need some work.");
});
test("it should work with a UPPERCASE function", () => {
	expect(
		interpolate("The UPPERCASE({type}) need some work.", { type: "shields" }),
	).toEqual("The SHIELDS need some work.");
});
test("it should work with a PLURALIZE function", () => {
	expect(
		interpolate("Send PLURALIZE({count},{tool},{tool}s)", {
			count: 0,
			tool: "spanner",
		}),
	).toEqual("Send 0 spanners");
	expect(
		interpolate("Send PLURALIZE({count},{tool},{tool}s)", {
			count: 1,
			tool: "spanner",
		}),
	).toEqual("Send 1 spanner");
	expect(
		interpolate("Send PLURALIZE({count},{tool},{tool}s)", {
			count: 2,
			tool: "spanner",
		}),
	).toEqual("Send 2 spanners");
});
test("it should support nesting interpolation blocks inside each other", () => {
	expect(
		interpolate(
			`[code|code|{~Alpha,Beta,Gamma,Delta,Zeta,Lambda,Omicron}-RANDOM(100,999)-{~Ansible,Cyber,Matrix,Naidon,Skadov,Memory,Faraday,Bernal,Dyson,Protocol,Vector,Analog,Digital,Buffer,Cache,Crypto,Fragment,System,Duplex,Threading,Hyper,Interlace,Progressive,Simplex,Multiplex,Syntax,Token}]`,
			{},
		),
	).toEqual("Alpha-293-Matrix");
	expect(
		interpolate(
			`[code|code|{~Alpha,Beta,Gamma,Delta,Zeta,Lambda,Omicron}-RANDOM(100,999)-{~Ansible,Cyber,Matrix,Naidon,Skadov,Memory,Faraday,Bernal,Dyson,Protocol,Vector,Analog,Digital,Buffer,Cache,Crypto,Fragment,System,Duplex,Threading,Hyper,Interlace,Progressive,Simplex,Multiplex,Syntax,Token}]`,
			{ code: "Hi there" },
		),
	).toEqual("Hi there");
});
