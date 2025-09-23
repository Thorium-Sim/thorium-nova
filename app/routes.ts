import {
	type RouteConfig,
	index,
	layout,
	prefix,
	route,
} from "@react-router/dev/routes";

export default [
	route("debug", "routes/debug.tsx"),
	layout("routes/landing/route.tsx", [
		index("routes/blank.tsx"),
		layout("routes/quickStart/layout.tsx", [
			route("flight/quick", "routes/quickStart/quickStart.tsx", [
				route("ship", "routes/quickStart/ship.tsx"),
				route("mission", "routes/quickStart/mission.tsx"),
			]),
		]),
	]),
	route("flight", "routes/flight/redirect.tsx"),
	route("flight/lobby", "routes/flight/lobby.tsx"),
	route("flight/station", "routes/station/index.tsx", [
		route("settings", "routes/station/settingsLayout.tsx", [
			index("routes/station/settingsIndex.tsx"),
			route("audio", "routes/station/audioSettings.tsx"),
			route("gamepad", "routes/station/gamepadSettings.tsx"),
		]),
	]),
	route("flight/core", "routes/core/index.tsx"),
	route("flight/core/preview/:component", "routes/core/Preview.tsx"),
	route("config", "routes/config/layout.tsx", [
		route(":pluginId?", "routes/config/index.tsx"),
		...prefix(":pluginId", [
			route("list", "routes/config/aspectList.tsx"),
			route("starmap", "routes/config/starmap/layout.tsx", [
				index("routes/config/starmap/index.tsx"),
				route(":systemId", "routes/config/starmap/system.tsx"),
			]),
			route("ships", "routes/config/ships/layout.tsx", [
				route(":shipId", "routes/config/ships/shipLayout.tsx", [
					route("basic", "routes/config/ships/basic.tsx"),
					route("assets", "routes/config/ships/assets.tsx"),
					route("cargo", "routes/config/ships/cargo.tsx"),
					route("physics", "routes/config/ships/physics.tsx"),
					route("shipMap", "routes/config/ships/shipMap.tsx", [
						route(":deckName", "routes/config/ships/shipMap/deckConfig.tsx"),
					]),
					route("systems", "routes/config/ships/systems.tsx", [
						route(
							"edit/:pluginId/:systemId",
							"routes/config/ships/systems/system.tsx",
							[
								route("basic", "routes/config/systems/basic.tsx", {
									id: "override-basic",
								}),
								route("heat", "routes/config/systems/heat.tsx", {
									id: "override-heat",
								}),
								route("power", "routes/config/systems/power.tsx", {
									id: "override-power",
								}),
								route(
									"sounds",
									"routes/config/systems/sounds.tsx",
									{
										id: "override-sounds",
									},
									[
										route(":sound", "routes/config/systems/soundId.tsx", {
											id: "override-sound",
										}),
									],
								),
								route(
									"system",
									"routes/config/ships/systems/systemOverride.tsx",
								),
							],
						),
					]),
				]),
			]),
			route("systems", "routes/config/systems/layout.tsx", [
				route(":systemId", "routes/config/systems/systemLayout.tsx", [
					route("basic", "routes/config/systems/basic.tsx"),
					route("heat", "routes/config/systems/heat.tsx"),
					route("damage", "routes/config/systems/damage.tsx"),
					route("power", "routes/config/systems/power.tsx"),
					route("sounds", "routes/config/systems/sounds.tsx", [
						route(":sound", "routes/config/systems/soundId.tsx"),
					]),
					route("system", "routes/config/systems/system.tsx"),
				]),
			]),
			route("missions", "routes/config/missions/layout.tsx", []),
			route("missions/:timelineId", "routes/config/missions/mission.tsx", [
				route("details", "routes/config/missions/details.tsx"),
				route(":stepId", "routes/config/missions/step.tsx"),
			]),
			route("reports", "routes/config/reports/report.tsx", []),
			route("macros", "routes/config/macros/layout.tsx", [
				route(":macroId", "routes/config/macros/macro.tsx"),
			]),
			route("triggers", "routes/config/triggers/layout.tsx", [
				route(":macroId", "routes/config/triggers/trigger.tsx"),
			]),
			route("themes", "routes/config/themes/layout.tsx", [
				route(":themeId", "routes/config/themes/theme.tsx"),
			]),
			route("inventory", "routes/config/inventory/layout.tsx", [
				route(":inventoryId", "routes/config/inventory/inventory.tsx"),
			]),
		]),
	]),
	route("releases", "routes/releases.tsx"),
	route("components", "routes/components.tsx"),
	route("development", "routes/development.tsx"),
	route("development/:cardId", "routes/developmentCard.tsx"),
	route("docs/*", "routes/docs/layout.tsx"),
	route("3d", "routes/3d.tsx"),
] satisfies RouteConfig;
