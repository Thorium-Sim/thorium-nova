export const reportVariableNames = [
	"damageReportId",
	"damageType",
	"damageMetric",
	"systemType",
	"systemName",
	"systemId",
	"shipId",
] as const;

export type ReportVariables = Record<(typeof reportVariableNames)[number], any>;
