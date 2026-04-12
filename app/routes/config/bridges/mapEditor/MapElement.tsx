import type { BridgeMapElement } from "@thorium/.server/classes/Plugins/Bridge";
import { SvgIcon } from "@thorium/ui/Icon";

/** Inline SVG filter for drop shadow. Render once inside the parent SVG via <MapElementDefs />. */
export function MapElementDefs() {
	return (
		<defs>
			<filter id="element-shadow" x="-20%" y="-20%" width="140%" height="140%">
				<feDropShadow
					dx="0"
					dy="1"
					stdDeviation="2"
					floodColor="#000"
					floodOpacity="0.6"
				/>
			</filter>
		</defs>
	);
}

export function MapElementRenderer({
	element,
	selected,
	onMouseDown,
	isMainViewscreen,
	viewscreenName,
	elementScale,
}: {
	element: BridgeMapElement;
	selected: boolean;
	onMouseDown: (e: React.MouseEvent) => void;
	isMainViewscreen?: boolean;
	viewscreenName?: string;
	elementScale: number;
}) {
	const strokeWidth = selected ? 2 : 1;

	switch (element.type) {
		case "station": {
			const assigned = Boolean(element.stationName);
			const stroke = selected ? "#60a5fa" : assigned ? "#4ade80" : "#9ca3af";
			const w = element.widthPixels ?? elementScale;
			const h = element.heightPixels ?? elementScale;
			const fontSize = w * 0.14;
			const iconSize = Math.min(w, h) * 0.7;
			return (
				<g
					transform={`translate(${element.x}, ${element.y}) rotate(${element.rotation})`}
					style={{ cursor: "pointer" }}
					filter="url(#element-shadow)"
					onMouseDown={onMouseDown}
				>
					<rect
						x={-w / 2}
						y={-h / 2}
						width={w}
						height={h}
						fill={assigned ? "#166534" : "#1e3a5f"}
						fillOpacity={0.7}
						stroke={stroke}
						strokeWidth={strokeWidth}
						rx={2}
					/>
					<SvgIcon
						name="laptop"
						x={-iconSize / 2}
						y={-iconSize / 2}
						width={iconSize}
						height={iconSize}
						stroke="#93c5fd"
					/>
					{element.label && (
						<text
							textAnchor="middle"
							dy={-(h / 2 + fontSize * 0.5)}
							fill="white"
							fontSize={fontSize}
						>
							{element.label}
						</text>
					)}
					{element.clientName && (
						<text
							textAnchor="middle"
							dy={h / 2 + fontSize * 1.2}
							fill="white"
							fontSize={fontSize}
						>
							{element.clientName}
						</text>
					)}
				</g>
			);
		}
		case "viewscreen": {
			const stroke = selected ? "#60a5fa" : "#9ca3af";
			const w = element.widthPixels ?? elementScale;
			const h = element.heightPixels ?? elementScale;
			const fontSize = w * 0.14;
			const iconSize = Math.min(w, h) * 0.35;
			const gap = iconSize * 0.1;
			const totalH = iconSize * 2 + gap;
			const topY = -totalH / 2;
			return (
				<g
					transform={`translate(${element.x}, ${element.y}) rotate(${element.rotation})`}
					style={{ cursor: "pointer" }}
					filter="url(#element-shadow)"
					onMouseDown={onMouseDown}
				>
					<rect
						x={-w / 2}
						y={-h / 2}
						width={w}
						height={h}
						fill="#3b1f5e"
						fillOpacity={0.7}
						stroke={stroke}
						strokeWidth={strokeWidth}
						rx={2}
					/>
					{/* video icon on top, rotated to point behind the display */}
					<SvgIcon
						name="video"
						x={-iconSize / 2}
						y={topY}
						width={iconSize}
						height={iconSize}
						stroke="#c084fc"
						transform={`rotate(270, ${0}, ${topY + iconSize / 2})`}
					/>
					{/* tv-minimal icon below */}
					<SvgIcon
						name="tv-minimal"
						x={-iconSize / 2}
						y={topY + iconSize + gap}
						width={iconSize}
						height={iconSize}
						stroke="#c084fc"
					/>
					{viewscreenName && (
						<text
							textAnchor="middle"
							dy={h / 2 + fontSize * 1.2}
							fill="white"
							fontSize={fontSize}
						>
							{viewscreenName}
						</text>
					)}
				</g>
			);
		}
		default:
			return null;
	}
}
