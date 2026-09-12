export const trainingVariableNames = [
	"clientId",
	"shipId",
	"station",
	"stationComplement",
	"timelineId",
] as const;

export type TrainingVariables = Record<(typeof trainingVariableNames)[number], any>;
