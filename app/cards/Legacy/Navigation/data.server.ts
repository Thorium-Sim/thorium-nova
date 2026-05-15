import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import z from "zod";

export const navigation = t.router({
	navigation: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(
			["isNavigation"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const navigation = getShipSystem(ctx.ecs, {
				systemType: "navigation",
				shipId: input.shipId,
			});
			const nav = navigation?.components.isNavigation;
			if (!nav) throw new Error("Navigation system not found");
			return {
				id: navigation.id,
				...nav,
			};
		}),
	update: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				calculate: z.boolean().optional(),
				thrusters: z.boolean().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			const navigation = getShipSystem(ctx.ecs, {
				systemType: "navigation",
				shipId: input.shipId,
			});
			if (!navigation) throw new Error("Navigation system not found.");
			navigation.updateComponent("isNavigation", {
				calculate: input.calculate ?? navigation.components.isNavigation?.calculate,
				thrusters: input.thrusters ?? navigation.components.isNavigation?.thrusters,
			});

			pubsub.publish.legacy.navigation.navigation({ shipId: input.shipId });
		}),
	scanForCourse: t.procedure
		.input(z.object({ shipId: z.number(), destination: z.string() }))
		.send(({ ctx, input }) => {
			const navigation = getShipSystem(ctx.ecs, {
				systemType: "navigation",
				shipId: input.shipId,
			});
			if (!navigation) throw new Error("Navigation system not found.");
			navigation.updateComponent("isNavigation", {
				scanning: true,
				destination: input.destination,
			});

			pubsub.publish.legacy.navigation.navigation({ shipId: input.shipId });
		}),
	cancelScan: t.procedure.input(z.object({ shipId: z.number() })).send(({ ctx, input }) => {
		const navigation = getShipSystem(ctx.ecs, {
			systemType: "navigation",
			shipId: input.shipId,
		});
		if (!navigation) throw new Error("Navigation system not found.");
		navigation.updateComponent("isNavigation", {
			scanning: false,
			destination: "",
			calculatedCourse: {
				x: "",
				y: "",
				z: "",
			},
		});

		pubsub.publish.legacy.navigation.navigation({ shipId: input.shipId });
	}),
	courseResult: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				result: z.object({ x: z.string(), y: z.string(), z: z.string() }),
			}),
		)
		.send(({ ctx, input }) => {
			const navigation = getShipSystem(ctx.ecs, {
				systemType: "navigation",
				shipId: input.shipId,
			});
			if (!navigation) throw new Error("Navigation system not found.");
			navigation.updateComponent("isNavigation", {
				scanning: false,
				calculatedCourse: input.result,
			});

			pubsub.publish.legacy.navigation.navigation({ shipId: input.shipId });
		}),
	courseSet: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				newCourse: z.object({ x: z.string(), y: z.string(), z: z.string() }),
			}),
		)
		.send(({ ctx, input }) => {
			const navigation = getShipSystem(ctx.ecs, {
				systemType: "navigation",
				shipId: input.shipId,
			});
			if (!navigation) throw new Error("Navigation system not found.");
			navigation.updateComponent("isNavigation", {
				scanning: false,
				currentCourse: input.newCourse,
			});

			pubsub.publish.legacy.navigation.navigation({ shipId: input.shipId });
		}),
});
