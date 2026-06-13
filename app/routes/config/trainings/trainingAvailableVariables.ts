export const trainingVariableNames = [
	"clientId",
	"shipId",
	"station",
	"stationComplement",
] as const;

export type TrainingVariables = Record<(typeof trainingVariableNames)[number], any>;
