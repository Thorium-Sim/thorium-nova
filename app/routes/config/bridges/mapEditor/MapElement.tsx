import type { BridgeMapElement } from "@thorium/.server/classes/Plugins/Bridge";
import { href as iconsHref } from "@thorium/ui/Icon";

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
}: {
	element: BridgeMapElement;
	selected: boolean;
	onMouseDown: (e: React.MouseEvent) => void;
	isMainViewscreen?: boolean;
	viewscreenName?: string;
}) {
	const strokeWidth = selected ? 2 : 1;

	switch (element.type) {
		case "station": {
			const assigned = Boolean(element.stationName);
			const stroke = selected ? "#60a5fa" : assigned ? "#4ade80" : "#9ca3af";
			const w = element.width ?? 20;
			const h = element.height ?? 20;
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
					{/* laptop icon */}
					<svg
						x={-iconSize / 2}
						y={-iconSize / 2}
						width={iconSize}
						height={iconSize}
						viewBox="0 0 24 24"
						fill="none"
						stroke="#93c5fd"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<use href={`${iconsHref}#laptop`} />
					</svg>
					{element.label && (
						<text
							textAnchor="middle"
							dy={-(h / 2 + w * 0.08)}
							fill="white"
							fontSize={w * 0.16}
						>
							{element.label}
						</text>
					)}
					{element.clientName && (
						<text
							textAnchor="middle"
							dy={h / 2 + w * 0.18}
							fill="white"
							fontSize={w * 0.14}
						>
							{element.clientName}
						</text>
					)}
				</g>
			);
		}
		case "viewscreen": {
			const stroke = selected ? "#60a5fa" : "#9ca3af";
			const w = element.width ?? 80;
			const h = element.height ?? 10;
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
					<svg
						x={-iconSize / 2}
						y={topY}
						width={iconSize}
						height={iconSize}
						viewBox="0 0 24 24"
						fill="none"
						stroke="#c084fc"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						transform={`rotate(270, ${0}, ${topY + iconSize / 2})`}
					>
						<use href={`${iconsHref}#video`} />
					</svg>
					{/* tv-minimal icon below */}
					<svg
						x={-iconSize / 2}
						y={topY + iconSize + gap}
						width={iconSize}
						height={iconSize}
						viewBox="0 0 24 24"
						fill="none"
						stroke="#c084fc"
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<use href={`${iconsHref}#tv-minimal`} />
					</svg>
					{viewscreenName && (
						<text
							textAnchor="middle"
							dy={h / 2 + w * 0.18}
							fill="white"
							fontSize={w * 0.16}
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
