import z from "zod";

export const panelElementTypes = z.enum([
	"toggleButton",
	"pressButton",
	"numberedButton",
	"switch",
	"numberedRotor",
	"numberedSlider",
	"cableSocket",
	"triSwitch",
	"numberPad",
]);
