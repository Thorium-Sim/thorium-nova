export const trainingVariableNames = [
	"clientId",
	"shipId",
	"station",
	"card",
	"stationComplement",
] as const;

export type TrainingVariables = Record<
	(typeof trainingVariableNames)[number],
	any
>;
