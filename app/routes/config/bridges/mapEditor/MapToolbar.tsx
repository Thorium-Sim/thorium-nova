import type { BridgeMapElementType } from "@thorium/.server/classes/Plugins/Bridge";

export type MapTool = "select" | BridgeMapElementType;

const tools: { id: MapTool; label: string }[] = [
	{ id: "select", label: "Select" },
	{ id: "station", label: "Add Clients" },
	{ id: "viewscreen", label: "Add Viewscreens" },
];

export function MapToolbar({
	activeTool,
	setActiveTool,
}: {
	activeTool: MapTool;
	setActiveTool: (tool: MapTool) => void;
}) {
	return (
		<div className="flex gap-1 flex-wrap">
			{tools.map((tool) => (
				<button
					key={tool.id}
					type="button"
					className={`px-2 py-1 text-xs rounded ${
						activeTool === tool.id
							? "bg-blue-600 text-white"
							: "bg-white/10 text-gray-300 hover:bg-white/20"
					}`}
					onClick={() => setActiveTool(tool.id)}
				>
					{tool.label}
				</button>
			))}
		</div>
	);
}
