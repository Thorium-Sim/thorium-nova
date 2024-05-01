import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import { z } from "zod";

export const targeting = t.router({
	setTarget: t.procedure
		.input(z.object({ target: z.number() }))
		.send(({ input }) => {}),
});
