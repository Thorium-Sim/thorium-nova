import type { isShortRangeComm } from "@thorium/ecs-components/shipSystems";
import type z from "zod";

export const shortRangeStateMap: Record<
	z.infer<typeof isShortRangeComm>["state"],
	string
> = {
	connected: "Connected",
	hailing: "Hailing",
	idle: "Idle",
};
