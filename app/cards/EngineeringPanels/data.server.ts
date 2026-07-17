import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { panelAssignment } from "@thorium/ecs-components/engineeringPanel";
import { engineeringPanelElementConfig } from "@thorium/ecs-components/engineeringPanelElementConfig";
import { Entity } from "@thorium/utils/ecs";
import { produce } from "immer";
import { z } from "zod";

const cableHandle = z.object({
	elementId: z.number(),
	portIndex: z.number(),
});
export const engineeringPanels = t.router({
	get: t.procedure
		.input(z.object({ panelId: z.number() }))
		.filter((publish: { panelId: number }, { input }) => {
			if (publish && "panelId" in publish && publish.panelId !== input.panelId) return false;

			return true;
		})
		.autoPublish(["isPanelElement", "isPanel"], (entity) =>
			entity.components.isPanel
				? { panelId: entity.id }
				: entity.components.isPanelElement?.panelId
					? { panelId: entity.components.isPanelElement.panelId }
					: null,
		)
		.request(({ ctx, input }) => {
			const panel = ctx.ecs.getEntityById(input.panelId);
			if (!panel) throw new Error("Panel not found");
			const panelElements: {
				id: number;
				name: string;
				element: z.infer<typeof engineeringPanelElementConfig>;
				state: number;
			}[] = [];
			for (const element of ctx.ecs.componentCache.get("isPanelElement") || []) {
				if (!element.components.isPanelElement) continue;
				panelElements.push({
					id: element.id,
					name: element.components.identity?.name || "Element",
					element: element.components.isPanelElement.element,
					state: element.components.isPanelElement.state,
				});
			}
			return {
				id: panel.id,
				cables: panel.components.isPanel?.cables || [],
				elements: panelElements,
			};
		}),
	updateElement: t.procedure
		.input(z.object({ elementId: z.number(), value: z.number() }))
		.send(({ ctx, input }) => {
			const element = ctx.ecs.getEntityById(input.elementId);
			if (!element) throw new Error("Panel Element Not Found");
			element.updateComponent("isPanelElement", { state: input.value });
			pubsub.publish.engineeringPanels.get({
				panelId: element.components.isPanelElement?.panelId || -1,
			});

			// Update the pressed counter if there's a relevant assignment
			for (const entity of ctx.ecs.componentCache.get("panelAssignment") || []) {
				const assignment = entity.components.panelAssignment;
				if (assignment?.panelId === element.components.isPanelElement?.panelId) {
					for (const element of assignment?.elements || []) {
						if (element.id === input.elementId && element.requiredCount > 0 && input.value > 0) {
							element.progress = Math.min(1, element.progress + 1 / element.requiredCount);
							if (element.progress >= 1) {
								element.complete = true;
							}
						}
					}
				}
			}

			// Return a boolean to indicate that the element has been set to the right value
			for (const panelAssignment of ctx.ecs.componentCache.get("panelAssignment") || []) {
				if (
					panelAssignment.components.panelAssignment?.shipId ===
						element.components.isPanelElement?.shipId &&
					panelAssignment.components.panelAssignment?.elements.some(
						(s) => s.id === input.elementId && s.requiredState === input.value,
					)
				) {
					return true;
				}
			}
			return false;
		}),

	addCable: t.procedure
		.input(
			z.object({
				panelId: z.number(),
				cableId: z.string(),
				color: z.string(),
				handles: z.tuple([cableHandle, cableHandle]),
			}),
		)
		.send(({ ctx, input }) => {
			const panel = ctx.ecs.getEntityById(input.panelId);
			if (!panel) throw new Error("Panel not found");
			panel.updateComponent("isPanel", {
				cables: [
					...(panel.components.isPanel?.cables || []),
					{ id: input.cableId, color: input.color, handles: input.handles },
				],
			});

			pubsub.publish.engineeringPanels.get({
				panelId: panel.id,
			});
		}),

	updateCable: t.procedure
		.input(
			z.object({
				panelId: z.number(),
				cableId: z.string(),
				handles: z.tuple([cableHandle, cableHandle]),
			}),
		)
		.send(({ ctx, input }) => {
			const panel = ctx.ecs.getEntityById(input.panelId);
			if (!panel) throw new Error("Panel not found");
			panel.updateComponent("isPanel", {
				cables: produce(panel.components.isPanel?.cables || [], (draft) => {
					for (const cable of draft) {
						if (cable.id === input.cableId) {
							cable.handles = input.handles;
						}
					}
				}),
			});

			pubsub.publish.engineeringPanels.get({
				panelId: panel.id,
			});
		}),

	removeCable: t.procedure
		.input(z.object({ panelId: z.number(), cableId: z.string() }))
		.send(({ ctx, input }) => {
			const panel = ctx.ecs.getEntityById(input.panelId);
			if (!panel) throw new Error("Panel not found");
			panel.updateComponent("isPanel", {
				cables: panel.components.isPanel?.cables.filter((c) => c.id !== input.cableId) || [],
			});

			pubsub.publish.engineeringPanels.get({
				panelId: panel.id,
			});
		}),
	generateAssignment: t.procedure
		.input(
			z.object({
				damageReportId: z.number().optional(),
				shipId: z.number().optional(),
				systemId: z.number().optional(),
				panelTag: z.string().optional(),
				elementCount: z.number().optional(),
			}),
		)
		.meta({
			action: () => {
				return {
					damageReportId: {
						name: "Damage Report ID",
					},
					shipId: {
						name: "Ship ID",
						helper: "Optional. Can be inferred from the Damage Report ID",
					},
					systemId: {
						name: "System ID",
						helper: "Optional. Can be inferred from the Damage Report ID",
					},
					panelTag: {
						name: "Panel Tag",
						helper: "Optional. Filter which panel the assignment is for by tagging the panel",
					},
				};
			},
		})
		.output(
			z.object({
				panelId: z.number(),
				panelName: z.string(),
				shipId: z.number(),
				systemId: z.number(),
				instructions: z.string(),
				assignmentId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			let { shipId, systemId, damageReportId } = input;
			const damageReport = ctx.ecs.getEntityById(damageReportId || -1);
			if (damageReport?.components.damageReport && !shipId) {
				shipId = damageReport.components.damageReport?.shipId;
			}
			if (!shipId) throw new Error("Either shipId or damageReportId is required");
			if (damageReport?.components.damageReport && !systemId) {
				systemId = damageReport.components.damageReport.systemId;
			}
			if (!systemId) throw new Error("Either systemId or damageReportId is required");

			const possiblePanels: Entity[] = [];
			const possibleTags = new Set<string>();
			for (const entity of ctx.ecs.componentCache.get("isPanel") || []) {
				if (entity.components.isPanel?.shipId === shipId) {
					for (const tag of entity.components.tags?.tags || []) {
						possibleTags.add(tag);
					}
					if (!input.panelTag || entity.components.tags?.tags.includes(input.panelTag))
						possiblePanels.push(entity);
				}
			}

			if (possiblePanels.length === 0)
				throw new Error(
					`Unable to generate assignment: no panels available. ${input.panelTag ? `Tag used: ${input.panelTag}. Possible tags: ${[...possibleTags].join(",")}` : ""}`,
				);

			const panel = ctx.ecs.rng.nextFromList(possiblePanels);

			const elementCount = input.elementCount || ctx.ecs.rng.nextInt(2, 5);
			const panelElements: Entity[] = [];
			const cableElements: Entity[] = [];
			for (const entity of ctx.ecs.componentCache.get("isPanelElement") || []) {
				if (entity.components.isPanelElement?.panelId === panel.id) {
					panelElements.push(entity);
					if (entity.components.isPanelElement.element.type === "cableSocket") {
						cableElements.push(entity);
					}
				}
			}
			let elements: z.infer<typeof panelAssignment>["elements"] = [];
			let instructions: string[] = [];
			while (elements.length < elementCount) {
				if (panelElements.length === 0) break;
				const elementIndex = ctx.ecs.rng.nextInt(0, panelElements.length - 1);
				const elementEntity = panelElements.splice(elementIndex, 1)[0];
				if (!elementEntity.components.isPanelElement || !elementEntity.components.identity)
					continue;
				const { element, state } = elementEntity.components.isPanelElement;
				const { name } = elementEntity.components.identity;
				let requiredDuration = 0;
				let requiredCount = 0;
				let requiredState = 0;
				let requiredConnection:
					| [{ elementId: number; portIndex: number }, { elementId: number; portIndex: number }]
					| undefined = undefined;
				// TODO July 16, 2026 - It would be great if these strings were user-defined with text patterns and interpolation.
				switch (element.type) {
					case "switch":
					case "triSwitch":
						requiredState = state === 1 ? 0 : 1;
						instructions.push(
							`Turn switch ${name} to the ${requiredState ? "on" : "off"} position.`,
						);
						break;
					case "numberPad":
						requiredState = ctx.ecs.rng.nextInt(10000, 99999);
						instructions.push(
							`Type "${requiredState}" into keypad ${name} and press the submit button.`,
						);
						break;
					// case "numberedRotor":
					// 	requiredState = ctx.ecs.rng.nextFromList(
					// 		Array.from({ length: element.max })
					// 			.map((_, i) => i)
					// 			.filter((i) => i !== state),
					// 	);
					// 	// Add one, since required state is an index
					// 	instructions.push(`Set dial ${name} to ${requiredState}.`);
					// 	break;
					case "numberedSlider":
						requiredState = ctx.ecs.rng.nextFromList(
							Array.from({ length: element.max })
								.map((_, i) => i)
								.filter((i) => i !== state),
						);
						instructions.push(`Set slider ${name} to ${requiredState}.`);
						break;
					case "pressButton":
						let isCount = ctx.ecs.rng.nextBoolean();
						if (isCount) {
							requiredCount = ctx.ecs.rng.nextInt(3, 10);
							instructions.push(`Press button ${name} ${requiredCount} times.`);
							break;
						} else {
							requiredDuration = ctx.ecs.rng.nextInt(3, 15);
							instructions.push(`Press and hold button ${name} for ${requiredDuration} seconds.`);
							break;
						}
					case "cableSocket":
						const startPortIndex = ctx.ecs.rng.nextInt(0, element.ports - 1);
						const endElement = ctx.ecs.rng.nextFromList(cableElements);
						if (
							endElement.components.isPanelElement?.element.type !== "cableSocket" ||
							!endElement.components.identity
						) {
							continue;
						}
						const endPortIndex = ctx.ecs.rng.nextInt(
							0,
							endElement.components.isPanelElement.element.ports - 1,
						);
						requiredConnection = [
							{ elementId: elementEntity.id, portIndex: startPortIndex },
							{
								elementId: endElement.id,
								portIndex: endPortIndex,
							},
						];
						instructions.push(
							`Connect a cable from ${name} port ${startPortIndex + 1} to ${endElement.id !== elementEntity.id ? `${endElement.components.identity.name} ` : ""} port ${endPortIndex + 1}`,
						);

						break;
					default:
						element satisfies never;
				}
				elements.push({
					id: elementEntity.id,
					complete: false,
					progress: 0,
					requiredCount,
					requiredDuration,
					requiredState,
					requiredConnection,
				});
			}

			const assignment = new Entity();
			assignment.addComponent("panelAssignment", {
				damageReportId,
				shipId,
				systemId,
				progress: 0,
				elements,
				panelId: panel.id,
			});
			ctx.ecs.addEntity(assignment);
			return {
				panelId: panel.id,
				panelName: panel.components.identity?.name || "",
				shipId,
				systemId,
				assignmentId: assignment.id,
				instructions: instructions.join("\n\n"),
			};
		}),
	// This is mostly used for listening for the event
	completeAssignment: t.procedure
		.meta({ event: true })
		.input(z.object({ assignmentId: z.number() }))
		.output(z.object({ assignmentId: z.number() }))
		.send(({ ctx, input }) => {
			ctx.ecs.removeEntityById(input.assignmentId);

			return input;
		}),
});
