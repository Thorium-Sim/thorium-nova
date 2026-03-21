import BridgePlugin from "@thorium/.server/classes/Plugins/Bridge";
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
			(
				publish: { pluginId: string; bridgeId: string } | null,
				{ input },
			) => {
				if (publish && input.pluginId !== publish.pluginId) return false;
				return true;
			},
		)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) return null;
			return {
				name: b.name,
				description: b.description,
				stationComplementRef: b.stationComplementRef,
				clientAssignments: b.clientAssignments,
				viewscreens: b.viewscreens,
				levels: b.levels.map((level) => ({
					id: level.id,
					name: level.name,
					backgroundUrl: level.backgroundUrl,
					
					imageWidth: level.imageWidth,
					imageHeight: level.imageHeight,
					elements: level.elements,
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
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
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
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) return { bridgeId: "" };
			if (typeof input.description === "string")
				b.description = input.description;
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
			const complements: {
				pluginId: string;
				stationComplementId: string;
				label: string;
			}[] = [];
			for (const plugin of ctx.server.plugins) {
				for (const sc of plugin.aspects.stationComplements) {
					complements.push({
						pluginId: plugin.id,
						stationComplementId: sc.name,
						label: `${sc.name} (${plugin.name})`,
					});
				}
			}
			return complements;
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
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			// Save current assignments for the current complement
			const oldKey = b.stationComplementRef
				? `${b.stationComplementRef.pluginId}:${b.stationComplementRef.stationComplementId}`
				: null;
			if (oldKey) {
				const elementStations: Record<string, string> = {};
				for (const level of b.levels) {
					for (const el of level.elements) {
						if (el.type === "station" && el.stationName) {
							elementStations[el.id] = el.stationName;
						}
					}
				}
				b.savedStationAssignments[oldKey] = {
					clientAssignments: JSON.parse(JSON.stringify(b.clientAssignments)),
					elementStations,
				};
			}

			b.stationComplementRef = input.stationComplementRef ?? undefined;

			// Restore saved assignments for the new complement, or clear
			const newKey = input.stationComplementRef
				? `${input.stationComplementRef.pluginId}:${input.stationComplementRef.stationComplementId}`
				: null;
			const saved = newKey ? b.savedStationAssignments[newKey] : null;

			b.clientAssignments.length = 0;
			if (saved) {
				for (const ca of saved.clientAssignments) {
					b.clientAssignments.push(ca);
				}
			}
			for (const level of b.levels) {
				for (const el of level.elements) {
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
			(
				publish: { pluginId: string; bridgeId: string } | null,
				{ input },
			) => {
				if (publish && input.pluginId !== publish.pluginId) return false;
				return true;
			},
		)
		.request(({ ctx, input }) => {
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b || !b.stationComplementRef) return [];
			const complementPlugin = ctx.server.plugins.find(
				(p) => p.id === b.stationComplementRef!.pluginId,
			);
			if (!complementPlugin) return [];
			const complement = complementPlugin.aspects.stationComplements.find(
				(sc) =>
					sc.name === b.stationComplementRef!.stationComplementId,
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
				brokenMode: z.enum(["fullyBroken", "cameraBrokenOnly", "invincible"]).optional(),
				fov: z.number().min(10).max(80).optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
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
			if (input.defaultPose !== undefined)
				vs.defaultPose = input.defaultPose;
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
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const idx = b.viewscreens.findIndex(
				(v) => v.id === input.viewscreenId,
			);
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
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			b.clientAssignments.push({
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
				newClientName: z.string().optional(),
				stationId: z.string().nullable().optional(),
				isSoundPlayer: z.boolean().optional(),
				tags: z.string().array().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const ca = b.clientAssignments.find(
				(c) => c.clientName === input.clientName,
			);
			if (!ca) throw new Error("Client assignment not found");
			if (typeof input.newClientName === "string") ca.clientName = input.newClientName;
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
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const idx = b.clientAssignments.findIndex(
				(c) => c.clientName === input.clientName,
			);
			if (idx >= 0) b.clientAssignments.splice(idx, 1);
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),

	// --- Levels ---
	addLevel: t.procedure
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
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const level = {
				id: crypto.randomUUID(),
				name: input.name,
				backgroundUrl: "",
				imageWidth: 800,
				imageHeight: 800,
				elements: [],
			};
			b.levels.push(level);
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
			return { levelId: level.id };
		}),
	updateLevel: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				levelId: z.string(),
				name: z.string().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const level = b.levels.find((f) => f.id === input.levelId);
			if (!level) throw new Error("Level not found");
			if (typeof input.name === "string") level.name = input.name;
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	removeLevel: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				levelId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const idx = b.levels.findIndex((f) => f.id === input.levelId);
			if (idx >= 0) b.levels.splice(idx, 1);
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),

	// --- Level Background ---
	uploadLevelBackground: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				levelId: z.string(),
				file: z.instanceof(File),
				imageWidth: z.number(),
				imageHeight: z.number(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const level = b.levels.find((f) => f.id === input.levelId);
			if (!level) throw new Error("Level not found");

			const arrayBuffer = await input.file.arrayBuffer();
			const base64 = Buffer.from(arrayBuffer).toString('base64');
			const mimeType = input.file.type || 'image/png';
			level.backgroundUrl = `data:${mimeType};base64,${base64}`;
			level.imageWidth = input.imageWidth;
			level.imageHeight = input.imageHeight;

			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
	removeLevelBackground: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				bridgeId: z.string(),
				levelId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const level = b.levels.find((f) => f.id === input.levelId);
			if (!level) throw new Error("Level not found");

			level.backgroundUrl = "";
			level.imageWidth = 800;
			level.imageHeight = 800;

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
				levelId: z.string(),
				type: elementTypeEnum,
				x: z.number(),
				y: z.number(),
				width: z.number().optional(),
				height: z.number().optional(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const floor = b.levels.find((f) => f.id === input.levelId);
			if (!floor) throw new Error("Level not found");

			const defaultSize = floor.imageWidth * 0.1;
			const element: Record<string, any> = {
				id: crypto.randomUUID(),
				type: input.type,
				x: input.x,
				y: input.y,
				rotation: 0,
			};

			if (input.type === "station") {
				element.width = input.width ?? defaultSize;
				element.height = input.height ?? defaultSize;
			} else if (input.type === "viewscreen") {
				element.width = input.width ?? defaultSize;
				element.height = input.height ?? defaultSize;
			}

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
				levelId: z.string(),
				elementId: z.string(),
				x: z.number().optional(),
				y: z.number().optional(),
				width: z.number().optional(),
				height: z.number().optional(),
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
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const floor = b.levels.find((f) => f.id === input.levelId);
			if (!floor) throw new Error("Level not found");
			const el = floor.elements.find((e) => e.id === input.elementId);
			if (!el) throw new Error("Element not found");
			if (typeof input.x === "number") el.x = input.x;
			if (typeof input.y === "number") el.y = input.y;
			if (typeof input.width === "number") el.width = input.width;
			if (typeof input.height === "number") el.height = input.height;
			if (typeof input.rotation === "number") el.rotation = input.rotation;
			if (typeof input.pitch === "number") el.pitch = input.pitch;
			if (typeof input.label === "string") el.label = input.label;
			if (typeof input.viewscreenId === "string")
				el.viewscreenId = input.viewscreenId;
			if (typeof input.stationName === "string") {
				el.stationName = input.stationName;
				el.label = input.stationName || "";
			}
			if (typeof input.clientName === "string") el.clientName = input.clientName;
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
				levelId: z.string(),
				elementId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const b = plugin.aspects.bridges.find(
				(b) => b.name === input.bridgeId,
			);
			if (!b) throw new Error("Bridge not found");
			const floor = b.levels.find((f) => f.id === input.levelId);
			if (!floor) throw new Error("Level not found");
			const idx = floor.elements.findIndex(
				(e) => e.id === input.elementId,
			);
			if (idx >= 0) {
				const removed = floor.elements[idx];
				// Auto-remove linked BridgeViewscreen when removing a viewscreen element
				if (removed.type === "viewscreen" && removed.viewscreenId) {
					const vsIdx = b.viewscreens.findIndex(
						(v) => v.id === removed.viewscreenId,
					);
					if (vsIdx >= 0) b.viewscreens.splice(vsIdx, 1);
				}
				floor.elements.splice(idx, 1);
			}
			pubsub.publish.plugin.bridge.get({
				pluginId: input.pluginId,
				bridgeId: b.name,
			});
		}),
});
