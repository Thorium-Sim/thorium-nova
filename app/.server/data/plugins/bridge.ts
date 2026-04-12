import BridgePlugin, {
	complementKey,
} from "@thorium/.server/classes/Plugins/Bridge";
import { t } from "@thorium/.server/init/t";
import { pubsub } from "@thorium/.server/init/pubsub";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { z } from "zod";
import { getPlugin } from "./utils";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";

const elementTypeEnum = z.enum(["station", "viewscreen"]);

export const bridge = t.router({
	available: t.procedure.request(({ ctx }) => {
		const bridges: { pluginId: string; bridgeId: string; label: string }[] = [];
		for (const plugin of ctx.server.plugins) {
			if (!plugin.active) continue;
			for (const b of plugin.aspects.bridges) {
				bridges.push({
					pluginId: plugin.id,
					bridgeId: b.name,
					label: `${b.name} (${plugin.name})`,
				});
			}
		}
		return bridges;
	}),
	all: t.procedure
		.input(z.object({ pluginId: z.string() }))
		.filter((publish: { pluginId: string } | null, { input }) => {
			if (publish && input.pluginId !== publish.pluginId) return false;
			return true;
		})
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			return plugin.aspects.bridges.map(({ name, description }) => ({
				name,
				description,
			}));
		}),
	get: t.procedure
		.input(z.object({ pluginId: z.string(), bridgeId: z.string() }))
		.filter(
			(publish: { pluginId: string; bridgeId: string } | null, { input }) => {
				if (publish && input.pluginId !== publish.pluginId) return false;
				return true;
			},
		)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) return null;
			const activeKey = complementKey(b.stationComplementRef);
			return {
				name: b.name,
				description: b.description,
				stationComplementRef: b.stationComplementRef,
				clientAssignments:
					(activeKey
						? b.stationAssignments[activeKey]?.clientAssignments
						: null) ?? [],
				viewscreens: b.viewscreens,
				elementScale: b.elementScale,
				floors: b.floors.map((floor) => ({
					id: floor.id,
					name: floor.name,
					backgroundUrl: floor.backgroundUrl,

					widthPixels: floor.widthPixels,
					heightPixels: floor.heightPixels,
					elements: floor.elements,
				})),
			};
		}),
	create: t.procedure
		.input(z.object({ pluginId: z.string(), name: z.string() }))
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = new BridgePlugin({ name: input.name }, plugin);
			plugin.aspects.bridges.push(b);
			pubsub.publish.plugin.bridge.all({ pluginId: input.pluginId });
			return { bridgeId: b.name };
		}),
	delete: t.procedure
		.input(z.object({ pluginId: z.string(), bridgeId: z.string() }))
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) return;
			plugin.aspects.bridges.splice(plugin.aspects.bridges.indexOf(b), 1);
			await b.remove();
			pubsub.publish.plugin.bridge.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	update: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				name: z.string().optional(),
				description: z.string().optional(),
				elementScale: z.number().positive().optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) return { bridgeId: "" };
			if (typeof input.description === "string")
				b.description = input.description;
			if (typeof input.elementScale === "number")
				b.elementScale = input.elementScale;
			if (input.name !== b.name && input.name) {
				await b.rename(input.name);
			}
			pubsub.publish.plugin.bridge.all({ pluginId: input.pluginId });
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
			return { bridgeId: b.name };
		}),

	// --- Station Complement ---
	allStationComplements: t.procedure
		.input(z.object({ pluginId: z.string() }))
		.request(({ ctx }) => {
			const groups: {
				header: string;
				items: { id: string; label: string }[];
			}[] = [];
			for (const plugin of ctx.server.plugins) {
				const items = plugin.aspects.stationComplements
					.slice()
					.sort((a, b) => a.stations.length - b.stations.length)
					.map((sc) => ({
						id: `${plugin.id}:${sc.name}`,
						label: `${sc.name} (${sc.stations.length})`,
					}));
				if (items.length > 0) {
					groups.push({ header: plugin.name, items });
				}
			}
			return groups;
		}),
	updateStationComplement: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				stationComplementRef: z
					.object({
						pluginId: z.string(),
						stationComplementId: z.string(),
					})
					.nullable(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			// Save current element station assignments for the old complement
			const oldKey = complementKey(b.stationComplementRef);
			if (oldKey) {
				const elementStations: Record<string, string> = {};
				for (const floor of b.floors) {
					for (const el of floor.elements) {
						if (el.type === "station" && el.stationName) {
							elementStations[el.id] = el.stationName;
						}
					}
				}
				if (!b.stationAssignments[oldKey]) {
					b.stationAssignments[oldKey] = {
						clientAssignments: [],
						elementStations,
					};
				} else {
					b.stationAssignments[oldKey].elementStations = elementStations;
				}
			}

			b.stationComplementRef = input.stationComplementRef ?? undefined;

			// Restore element station assignments from the new complement, or clear
			const newKey = complementKey(b.stationComplementRef);
			const saved = newKey ? b.stationAssignments[newKey] : null;
			for (const floor of b.floors) {
				for (const el of floor.elements) {
					if (el.type === "station") {
						const restored = saved?.elementStations[el.id] ?? "";
						el.stationName = restored;
						el.label = restored;
					}
				}
			}
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
			pubsub.publish.plugin.bridge.getStationComplementStations({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	getStationComplementStations: t.procedure
		.input(z.object({ pluginId: z.string(), bridgeId: z.string() }))
		.filter(
			(publish: { pluginId: string; bridgeId: string } | null, { input }) => {
				if (publish && input.pluginId !== publish.pluginId) return false;
				return true;
			},
		)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b || !b.stationComplementRef) return [];
			const complementPlugin = ctx.server.plugins.find(
				(p) => p.id === b.stationComplementRef!.pluginId,
			);
			if (!complementPlugin) return [];
			const complement = complementPlugin.aspects.stationComplements.find(
				(sc) => sc.name === b.stationComplementRef!.stationComplementId,
			);
			if (!complement) return [];
			return complement.stations.map((s) => s.name);
		}),

	// --- Viewscreens ---
	updateViewscreen: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				viewscreenId: z.string(),
				name: z.string().optional(),
				tags: z.string().array().optional(),
				isMainViewscreen: z.boolean().optional(),
				defaultPose: z
					.object({ poseId: z.string(), pluginId: z.string() })
					.nullable()
					.optional(),
				showGizmos: z.boolean().optional(),
				showLayout: z.boolean().optional(),
				brokenMode: z
					.enum(["fullyBroken", "cameraBrokenOnly", "invincible"])
					.optional(),
				fov: z.number().min(1).max(179).optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const vs = b.viewscreens.find((v) => v.id === input.viewscreenId);
			if (!vs) throw new Error("Viewscreen not found");
			if (typeof input.name === "string") {
				const duplicate = b.viewscreens.some(
					(v) => v.id !== input.viewscreenId && v.name === input.name,
				);
				if (duplicate)
					throw new Error(
						`A viewscreen named "${input.name}" already exists on this bridge`,
					);
				vs.name = input.name;
			}
			if (input.tags) vs.tags = input.tags;
			if (typeof input.isMainViewscreen === "boolean")
				vs.isMainViewscreen = input.isMainViewscreen;
			if (input.defaultPose !== undefined) vs.defaultPose = input.defaultPose;
			if (typeof input.showGizmos === "boolean")
				vs.showGizmos = input.showGizmos;
			if (typeof input.showLayout === "boolean")
				vs.showLayout = input.showLayout;
			if (input.brokenMode) vs.brokenMode = input.brokenMode;
			if (typeof input.fov === "number") vs.fov = input.fov;
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	removeViewscreen: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				viewscreenId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const idx = b.viewscreens.findIndex((v) => v.id === input.viewscreenId);
			if (idx >= 0) b.viewscreens.splice(idx, 1);
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),

	// --- Client Assignments ---
	addClientAssignment: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				clientName: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const key = complementKey(b.stationComplementRef);
			if (!key) throw new Error("No station complement selected");
			if (!b.stationAssignments[key]) {
				b.stationAssignments[key] = {
					clientAssignments: [],
					elementStations: {},
				};
			}
			b.stationAssignments[key].clientAssignments.push({
				clientName: input.clientName,
				stationId: null,
				isSoundPlayer: false,
				tags: [],
			});
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	updateClientAssignment: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				clientName: z.string(),
				stationId: z.string().nullable().optional(),
				isSoundPlayer: z.boolean().optional(),
				tags: z.string().array().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const key = complementKey(b.stationComplementRef);
			if (!key) throw new Error("No station complement selected");
			const ca = b.stationAssignments[key]?.clientAssignments.find(
				(c) => c.clientName === input.clientName,
			);
			if (!ca) throw new Error("Client assignment not found");
			if (input.stationId !== undefined) ca.stationId = input.stationId;
			if (typeof input.isSoundPlayer === "boolean")
				ca.isSoundPlayer = input.isSoundPlayer;
			if (input.tags) ca.tags = input.tags;
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	removeClientAssignment: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				clientName: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const key = complementKey(b.stationComplementRef);
			if (!key) throw new Error("No station complement selected");
			const assignments = b.stationAssignments[key]?.clientAssignments;
			if (assignments) {
				const idx = assignments.findIndex(
					(c) => c.clientName === input.clientName,
				);
				if (idx >= 0) assignments.splice(idx, 1);
			}
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),

	// --- Floors ---
	addFloor: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				name: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const floor = {
				id: crypto.randomUUID(),
				name: input.name,
				backgroundUrl: "",
				widthPixels: 800,
				heightPixels: 800,
				elements: [],
			};
			b.floors.push(floor);
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
			return { floorId: floor.id };
		}),
	updateFloor: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				floorId: z.string(),
				name: z.string().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const floor = b.floors.find((f) => f.id === input.floorId);
			if (!floor) throw new Error("Floor not found");
			if (typeof input.name === "string") floor.name = input.name;
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	removeFloor: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				floorId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const idx = b.floors.findIndex((f) => f.id === input.floorId);
			if (idx >= 0) {
				const floor = b.floors[idx];
				// Clean up linked viewscreens and client assignments for elements on this floor
				for (const el of floor.elements) {
					if (el.type === "viewscreen" && el.viewscreenId) {
						const vsIdx = b.viewscreens.findIndex(
							(v) => v.id === el.viewscreenId,
						);
						if (vsIdx >= 0) b.viewscreens.splice(vsIdx, 1);
					}
					if (el.clientName) {
						for (const sa of Object.values(b.stationAssignments)) {
							const caIdx = sa.clientAssignments.findIndex(
								(c) => c.clientName === el.clientName,
							);
							if (caIdx >= 0) sa.clientAssignments.splice(caIdx, 1);
						}
					}
				}
				b.floors.splice(idx, 1);
			}
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),

	// --- Floor Background ---
	// Background images are stored as base64 data URIs directly in the YAML
	// manifest so that bridge configs remain fully portable as single files.
	uploadFloorBackground: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				floorId: z.string(),
				file: z.instanceof(File),
				widthPixels: z.number(),
				heightPixels: z.number(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const floor = b.floors.find((f) => f.id === input.floorId);
			if (!floor) throw new Error("Floor not found");

			const arrayBuffer = await input.file.arrayBuffer();
			const base64 = Buffer.from(arrayBuffer).toString("base64");
			const mimeType = input.file.type || "image/png";
			floor.backgroundUrl = `data:${mimeType};base64,${base64}`;
			floor.widthPixels = input.widthPixels;
			floor.heightPixels = input.heightPixels;

			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	removeFloorBackground: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				floorId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const floor = b.floors.find((f) => f.id === input.floorId);
			if (!floor) throw new Error("Floor not found");

			floor.backgroundUrl = "";
			floor.widthPixels = 800;
			floor.heightPixels = 800;

			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	// --- Map Elements ---
	addElement: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				floorId: z.string(),
				type: elementTypeEnum,
				x: z.number(),
				y: z.number(),
				widthPixels: z.number().optional(),
				heightPixels: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const floor = b.floors.find((f) => f.id === input.floorId);
			if (!floor) throw new Error("Floor not found");

			const element: Record<string, any> = {
				id: crypto.randomUUID(),
				type: input.type,
				x: input.x,
				y: input.y,
				rotation: 0,
			};

			if (input.widthPixels !== undefined)
				element.widthPixels = input.widthPixels;
			if (input.heightPixels !== undefined)
				element.heightPixels = input.heightPixels;

			// Auto-assign a default client name
			const existingClientNames = b.floors.flatMap((f) =>
				f.elements.filter((e) => e.clientName).map((e) => e.clientName!),
			);
			element.clientName = generateIncrementedName(
				"Client",
				existingClientNames,
			);

			// Auto-create a BridgeViewscreen when placing a viewscreen element
			if (input.type === "viewscreen") {
				const vsName = generateIncrementedName(
					"Viewscreen",
					b.viewscreens.map((v) => v.name),
				);
				const viewscreen = {
					id: crypto.randomUUID(),
					name: vsName,
					tags: [],
					defaultPose: null,
					showGizmos: true,
					showLayout: true,
					brokenMode: "fullyBroken" as const,
				};
				b.viewscreens.push(viewscreen);
				element.viewscreenId = viewscreen.id;
			}

			floor.elements.push(element as any);
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
			return { elementId: element.id as string };
		}),
	updateElement: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				floorId: z.string(),
				elementId: z.string(),
				x: z.number().optional(),
				y: z.number().optional(),
				widthPixels: z.number().nullable().optional(),
				heightPixels: z.number().nullable().optional(),
				rotation: z.number().optional(),
				pitch: z.number().optional(),
				label: z.string().optional(),
				viewscreenId: z.string().optional(),
				stationName: z.string().optional(),
				clientName: z.string().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const floor = b.floors.find((f) => f.id === input.floorId);
			if (!floor) throw new Error("Floor not found");
			const el = floor.elements.find((e) => e.id === input.elementId);
			if (!el) throw new Error("Element not found");
			if (typeof input.x === "number") el.x = input.x;
			if (typeof input.y === "number") el.y = input.y;
			if (input.widthPixels === null) el.widthPixels = undefined;
			else if (typeof input.widthPixels === "number")
				el.widthPixels = input.widthPixels;
			if (input.heightPixels === null) el.heightPixels = undefined;
			else if (typeof input.heightPixels === "number")
				el.heightPixels = input.heightPixels;
			if (typeof input.rotation === "number") el.rotation = input.rotation;
			if (typeof input.pitch === "number" && el.type === "viewscreen")
				el.pitch = input.pitch;
			if (typeof input.label === "string") el.label = input.label;
			if (typeof input.viewscreenId === "string" && el.type === "viewscreen")
				el.viewscreenId = input.viewscreenId;
			if (typeof input.stationName === "string" && el.type === "station") {
				el.stationName = input.stationName;
				el.label = input.stationName || "";
				// Persist element-station mapping for the active complement
				const activeKey = complementKey(b.stationComplementRef);
				if (activeKey) {
					if (!b.stationAssignments[activeKey]) {
						b.stationAssignments[activeKey] = {
							clientAssignments: [],
							elementStations: {},
						};
					}
					if (input.stationName) {
						b.stationAssignments[activeKey].elementStations[el.id] = input.stationName;
					} else {
						delete b.stationAssignments[activeKey].elementStations[el.id];
					}
				}
			}
			if (typeof input.clientName === "string") {
				const oldClientName = el.clientName;
				el.clientName = input.clientName;
				// Propagate clientName rename across all complement assignments
				if (oldClientName && oldClientName !== input.clientName) {
					for (const sa of Object.values(b.stationAssignments)) {
						for (const ca of sa.clientAssignments) {
							if (ca.clientName === oldClientName) {
								ca.clientName = input.clientName;
							}
						}
					}
				}
			}
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	removeElement: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				floorId: z.string(),
				elementId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find((b) => b.name === input.bridgeId);
			if (!b) throw new Error("Bridge not found");
			const floor = b.floors.find((f) => f.id === input.floorId);
			if (!floor) throw new Error("Floor not found");
			const idx = floor.elements.findIndex((e) => e.id === input.elementId);
			if (idx >= 0) {
				const removed = floor.elements[idx];
				// Auto-remove linked BridgeViewscreen when removing a viewscreen element
				if (removed.type === "viewscreen" && removed.viewscreenId) {
					const vsIdx = b.viewscreens.findIndex(
						(v) => v.id === removed.viewscreenId,
					);
					if (vsIdx >= 0) b.viewscreens.splice(vsIdx, 1);
				}
				// Clean up elementStations for this element across all complements
				for (const sa of Object.values(b.stationAssignments)) {
					delete sa.elementStations[removed.id];
				}
				floor.elements.splice(idx, 1);
			}
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
});
