import { t } from "@thorium/.server/init/t";
import { z } from "zod";

export const timer = t.router({
	pause: t.procedure.input(z.object({ timerId: z.number() })).send(({ ctx, input }) => {
		const timer = ctx.ecs.getEntityById(input.timerId);
		timer?.updateComponent("timer", { paused: true });
	}),
	resume: t.procedure.input(z.object({ timerId: z.number() })).send(({ ctx, input }) => {
		const timer = ctx.ecs.getEntityById(input.timerId);
		timer?.updateComponent("timer", { paused: false });
	}),
});
