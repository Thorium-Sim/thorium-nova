export const reportVariableNames = [
	"damageType",
	"damageMetric",
	"systemType",
	"systemName",
	"systemId",
	"shipId",
] as const;

export type ReportVariables = Record<(typeof reportVariableNames)[number], any>;
