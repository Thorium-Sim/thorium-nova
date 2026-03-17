import { useState, useRef, useCallback, useEffect } from "react";
import PanZoom from "@thorium/components/ui/PanZoom";
import type {
	BridgeLevel,
	BridgeViewscreen,
	BridgeClientAssignment,
	BridgeMapElementType,
} from "@thorium/.server/classes/Plugins/Bridge";
import { q } from "@thorium/context/AppContext";
import { MapToolbar, type MapTool } from "./MapToolbar";
import { MapElementRenderer, MapElementDefs } from "./MapElement";
import { MapElementEditor } from "./MapElementEditor";
import {
	GRID_SIZE_PX,
	DEFAULT_CANVAS_SIZE,
	STATION_SIZE_FRACTION,
	VIEWSCREEN_SIZE_FRACTION,
} from "./constants";
import type { BridgeMapElement } from "@thorium/.server/classes/Plugins/Bridge";

const ROTATION_HANDLE_OFFSET = 30;

function getElementBounds(el: BridgeMapElement): { w: number; h: number; ox: number; oy: number } {
	return { w: el.width ?? 20, h: el.height ?? 20, ox: 0, oy: 0 };
}

interface PanState {
	x: number;
	y: number;
	scale: number;
}

type DragMode = "move" | "rotate" | "scale" | null;

const HANDLE_SIZE = 6;

type ScaleCorner = 0 | 1 | 2 | 3;

export function MapCanvas({
	pluginId,
	bridgeId,
	level,
	viewscreens,
	stationNames,
	clientAssignments,
	assignedStations,
}: {
	pluginId: string;
	bridgeId: string;
	level: BridgeLevel;
	viewscreens: BridgeViewscreen[];
	stationNames: string[];
	clientAssignments: BridgeClientAssignment[];
	assignedStations: Set<string>;
}) {
	const [activeTool, setActiveTool] = useState<MapTool>("select");
	const panState = useRef<PanState>({ x: 0, y: 0, scale: 1 });
	const svgRef = useRef<SVGSVGElement>(null);
	const activeToolRef = useRef(activeTool);
	activeToolRef.current = activeTool;

	const canvasWidth = level.backgroundUrl ? level.imageWidth : DEFAULT_CANVAS_SIZE;
	const canvasHeight = level.backgroundUrl ? level.imageHeight : DEFAULT_CANVAS_SIZE;

	// Intercept wheel events: stop outer scroll and force zoom behavior
	const canvasWrapperRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = canvasWrapperRef.current;
		if (!el) return;
		const handler = (e: WheelEvent) => {
			e.preventDefault();
			if (e.ctrlKey || e.metaKey) return;
			e.stopImmediatePropagation();
			const zoomEvent = new WheelEvent("wheel", {
				deltaX: e.deltaX,
				deltaY: e.deltaY,
				deltaZ: e.deltaZ,
				deltaMode: e.deltaMode,
				clientX: e.clientX,
				clientY: e.clientY,
				screenX: e.screenX,
				screenY: e.screenY,
				ctrlKey: true,
				bubbles: false,
			});
			el.firstElementChild?.dispatchEvent(zoomEvent);
		};
		el.addEventListener("wheel", handler, { passive: false, capture: true });
		return () => el.removeEventListener("wheel", handler, { capture: true });
	}, []);

	// Drag state
	const dragMode = useRef<DragMode>(null);
	const dragElementId = useRef<string | null>(null);
	const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const dragElementStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const dragStartRotation = useRef<number>(0);
	const scaleCorner = useRef<ScaleCorner>(0);
	const dragElementSize = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
	const [isDragging, setIsDragging] = useState(false);

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selectedElement = level.elements.find((e) => e.id === selectedId);

	const getSvgPoint = useCallback(
		(clientX: number, clientY: number) => {
			const svg = svgRef.current;
			if (!svg) return { x: 0, y: 0 };
			const rect = svg.getBoundingClientRect();
			const x = (clientX - rect.left) / panState.current.scale;
			const y = (clientY - rect.top) / panState.current.scale;
			return { x, y };
		},
		[],
	);

	const handleElementMouseDown = useCallback(
		(elementId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();
			if (activeTool !== "select") {
				setActiveTool("select");
			}
			setSelectedId(elementId);

			const el = level.elements.find((el) => el.id === elementId);
			if (!el) return;

			dragMode.current = "move";
			dragElementId.current = elementId;
			dragStart.current = getSvgPoint(e.clientX, e.clientY);
			dragElementStart.current = { x: el.x, y: el.y };
			setIsDragging(true);
		},
		[activeTool, level.elements, getSvgPoint],
	);

	const handleRotateMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!selectedElement) return;
			e.stopPropagation();
			e.preventDefault();

			dragMode.current = "rotate";
			dragElementId.current = selectedElement.id;
			dragStart.current = getSvgPoint(e.clientX, e.clientY);
			dragStartRotation.current = selectedElement.rotation;
			dragElementStart.current = { x: selectedElement.x, y: selectedElement.y };
			setIsDragging(true);
		},
		[selectedElement, getSvgPoint],
	);

	const handleScaleMouseDown = useCallback(
		(corner: ScaleCorner, e: React.MouseEvent) => {
			if (!selectedElement) return;
			e.stopPropagation();
			e.preventDefault();

			dragMode.current = "scale";
			dragElementId.current = selectedElement.id;
			scaleCorner.current = corner;
			dragStart.current = getSvgPoint(e.clientX, e.clientY);
			dragElementStart.current = { x: selectedElement.x, y: selectedElement.y };
			const bounds = getElementBounds(selectedElement);
			dragElementSize.current = {
				width: bounds.w,
				height: bounds.h,
			};
			setIsDragging(true);
		},
		[selectedElement, getSvgPoint],
	);

	const handleCanvasMouseMove = useCallback(
		(e: React.MouseEvent<SVGSVGElement>) => {
			if (!dragMode.current || !dragElementId.current) return;
			const pt = getSvgPoint(e.clientX, e.clientY);
			const el = level.elements.find((el) => el.id === dragElementId.current);
			if (!el) return;

			if (dragMode.current === "move") {
				const dx = pt.x - dragStart.current.x;
				const dy = pt.y - dragStart.current.y;
				el.x = dragElementStart.current.x + dx;
				el.y = dragElementStart.current.y + dy;
				setIsDragging((v) => !v);
			} else if (dragMode.current === "rotate") {
				const angle = Math.atan2(
					pt.y - el.y,
					pt.x - el.x,
				);
				const startAngle = Math.atan2(
					dragStart.current.y - el.y,
					dragStart.current.x - el.x,
				);
				const delta = ((angle - startAngle) * 180) / Math.PI;
				el.rotation = Math.round(dragStartRotation.current + delta);
				setIsDragging((v) => !v);
			} else if (dragMode.current === "scale") {
				const rad = (el.rotation * Math.PI) / 180;
				const cos = Math.cos(rad);
				const sin = Math.sin(rad);
				const rawDx = pt.x - dragStart.current.x;
				const rawDy = pt.y - dragStart.current.y;
				const localDx = rawDx * cos + rawDy * sin;
				const localDy = -rawDx * sin + rawDy * cos;

				const origW = dragElementSize.current.width;
				const origH = dragElementSize.current.height;
				const origX = dragElementStart.current.x;
				const origY = dragElementStart.current.y;

				const corner = scaleCorner.current;
				const signX = corner === 0 || corner === 3 ? -1 : 1;
				const signY = corner === 0 || corner === 1 ? -1 : 1;

				const newW = Math.max(4, origW + localDx * signX);
				const newH = Math.max(4, origH + localDy * signY);

				const dw = newW - origW;
				const dh = newH - origH;
				const shiftLocalX = (dw * signX) / 2;
				const shiftLocalY = (dh * signY) / 2;
				el.x = origX + shiftLocalX * cos - shiftLocalY * sin;
				el.y = origY + shiftLocalX * sin + shiftLocalY * cos;
				el.width = newW;
				el.height = newH;
				setIsDragging((v) => !v);
			}
		},
		[level.elements, getSvgPoint],
	);

	const handleCanvasMouseUp = useCallback(
		async (e: React.MouseEvent<SVGSVGElement>) => {
			// Finish element drag
			if (dragMode.current && dragElementId.current) {
				const el = level.elements.find((el) => el.id === dragElementId.current);
				if (el) {
					const updateParams: any = {
						pluginId,
						bridgeId,
						levelId: level.id,
						elementId: el.id,
						x: el.x,
						y: el.y,
						rotation: el.rotation,
					};
					if (el.width !== undefined) updateParams.width = el.width;
					if (el.height !== undefined) updateParams.height = el.height;
					await q.plugin.bridge.updateElement.netSend(updateParams);
				}
				dragMode.current = null;
				dragElementId.current = null;
				setIsDragging(false);
				return;
			}

			// Place discrete element
			if (activeTool !== "select") {
				const pt = getSvgPoint(e.clientX, e.clientY);
				const defaultSize = canvasWidth * STATION_SIZE_FRACTION;
				const params: any = {
					pluginId,
					bridgeId,
					levelId: level.id,
					type: activeTool as BridgeMapElementType,
					x: pt.x,
					y: pt.y,
				};
				if (activeTool === "station") {
					params.width = defaultSize;
					params.height = defaultSize;
				} else if (activeTool === "viewscreen") {
					const vsSize = canvasWidth * VIEWSCREEN_SIZE_FRACTION;
					params.width = vsSize;
					params.height = vsSize;
				}
				await q.plugin.bridge.addElement.netSend(params);
			}
		},
		[activeTool, pluginId, bridgeId, level.id, level.elements, getSvgPoint, canvasWidth],
	);

	const handleDeleteElement = useCallback(async () => {
		if (!selectedId) return;
		await q.plugin.bridge.removeElement.netSend({
			pluginId,
			bridgeId,
			levelId: level.id,
			elementId: selectedId,
		});
		setSelectedId(null);
	}, [selectedId, pluginId, bridgeId, level.id]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (!selectedId) return;
			if (e.key === "Delete" || e.key === "Backspace") {
				const tag = (e.target as HTMLElement)?.tagName;
				if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
				e.preventDefault();
				handleDeleteElement();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [selectedId, handleDeleteElement]);

	return (
		<div className="flex flex-col gap-2 flex-1 min-h-0 relative">
			<MapToolbar activeTool={activeTool} setActiveTool={setActiveTool} />
			<div
				ref={canvasWrapperRef}
				className="flex-1 min-h-0 border border-white/10 rounded-lg bg-gray-900 overflow-hidden relative"
			>
				<PanZoom
					style={{ width: "100%", height: "100%", outline: "none" }}
					maxZoom={8}
					minZoom={0.2}
					noStateUpdate={false}
					preventPan={() =>
						activeToolRef.current !== "select" || dragMode.current !== null
					}
					onStateChange={(state: PanState) => {
						panState.current = state;
					}}
					onMouseDown={() => {
						if (activeTool === "select" && !dragMode.current)
							setSelectedId(null);
					}}
					disableDoubleClickZoom
				>
					<svg
						ref={svgRef}
						width={canvasWidth}
						height={canvasHeight}
						viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
						overflow="visible"
						onMouseMove={handleCanvasMouseMove}
						onMouseUp={handleCanvasMouseUp}
					>
						<MapElementDefs />
						{/* Front of ship label */}
						<text
							x={canvasWidth / 2}
							y={-canvasWidth * 0.02}
							textAnchor="middle"
							fill="#9ca3af"
							fontSize={canvasWidth * 0.03}
							pointerEvents="none"
						>
							Front of Ship
						</text>
						{/* Grid */}
						<g stroke="#374151" strokeWidth="0.5" shapeRendering="crispEdges">
							{Array.from(
								{ length: Math.floor(canvasWidth / GRID_SIZE_PX) + 1 },
								(_, i) => {
									const pos = i * GRID_SIZE_PX;
									return <line key={`v${i}`} x1={pos} y1={0} x2={pos} y2={canvasHeight} />;
								},
							)}
							{Array.from(
								{ length: Math.floor(canvasHeight / GRID_SIZE_PX) + 1 },
								(_, i) => {
									const pos = i * GRID_SIZE_PX;
									return <line key={`h${i}`} x1={0} y1={pos} x2={canvasWidth} y2={pos} />;
								},
							)}
						</g>
						{/* Background image */}
						{level.backgroundUrl && (
							<image
								href={level.backgroundUrl}
								width={canvasWidth}
								height={canvasHeight}
							/>
						)}

						{/* Elements */}
						{level.elements.map((el) => {
						const linkedVs = el.type === "viewscreen" && el.viewscreenId
							? viewscreens.find((v) => v.id === el.viewscreenId)
							: null;
						return (
							<MapElementRenderer
								key={el.id}
								element={el}
								selected={selectedId === el.id}
								onMouseDown={(e) => handleElementMouseDown(el.id, e)}
								isMainViewscreen={linkedVs?.isMainViewscreen}
								viewscreenName={linkedVs?.name}
							/>
						);
					})}

						{/* Selection overlay: scale handles + rotation handle */}
						{selectedElement && activeTool === "select" && (() => {
							const el = selectedElement;
							const { w, h, ox, oy } = getElementBounds(el);
							const hw = w / 2;
							const hh = h / 2;
							const corners: [number, number, ScaleCorner, string][] = [
								[-hw, -hh, 0, "nwse-resize"],
								[hw, -hh, 1, "nesw-resize"],
								[hw, hh, 2, "nwse-resize"],
								[-hw, hh, 3, "nesw-resize"],
							];
							return (
								<g
									transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
									pointerEvents="all"
								>
									<g transform={`translate(${ox}, ${oy})`}>
										<rect
											x={-hw}
											y={-hh}
											width={w}
											height={h}
											fill="none"
											stroke="#60a5fa"
											strokeWidth={1}
											strokeDasharray="3,3"
											pointerEvents="none"
										/>
										{corners.map(([cx, cy, corner, cursor]) => (
											<rect
												key={corner}
												x={cx - HANDLE_SIZE / 2}
												y={cy - HANDLE_SIZE / 2}
												width={HANDLE_SIZE}
												height={HANDLE_SIZE}
												fill="white"
												stroke="#60a5fa"
												strokeWidth={1}
												style={{ cursor }}
												onMouseDown={(e) => handleScaleMouseDown(corner, e)}
											/>
										))}
										<line
											x1={0}
											y1={-hh}
											x2={0}
											y2={-hh - ROTATION_HANDLE_OFFSET}
											stroke="#60a5fa"
											strokeWidth={1}
											strokeDasharray="3,3"
											pointerEvents="none"
										/>
										<circle
											cx={0}
											cy={-hh - ROTATION_HANDLE_OFFSET}
											r={5}
											fill="#60a5fa"
											stroke="white"
											strokeWidth={1}
											style={{ cursor: "grab" }}
											onMouseDown={handleRotateMouseDown}
										/>
									</g>
								</g>
							);
						})()}
					</svg>
				</PanZoom>

				{/* Element property editor */}
				{selectedElement && (
					<MapElementEditor
						key={selectedElement.id}
						element={selectedElement}
						pluginId={pluginId}
						bridgeId={bridgeId}
						levelId={level.id}
						viewscreens={viewscreens}
						stationNames={stationNames}
						assignedStations={assignedStations}
						onDelete={handleDeleteElement}
					/>
				)}
			</div>
			<p className="text-xs text-gray-500">
				{activeTool === "select"
					? "Click elements to select and drag to move. Use the handle above to rotate."
					: "Click to place."}
			</p>
		</div>
	);
}
