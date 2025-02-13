import { z } from "zod";
export const scanTypes = z.enum([
	"iff",
	"crew",
	"cargo",
	"shields",
	"weapons",
	"targeting",
	"damage",
]);
