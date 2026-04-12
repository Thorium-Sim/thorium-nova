import { useState, useRef, useCallback, useEffect } from "react";
import PanZoom from "@thorium/components/ui/PanZoom";
import type {
	BridgeFloor,
	BridgeViewscreen,
	BridgeClientAssignment,
	BridgeMapElementType,
} from "@thorium/.server/classes/Plugins/Bridge";
import { q } from "@thorium/context/AppContext";
import { MapToolbar, type MapTool } from "./MapToolbar";
import { MapElementRenderer, MapElementDefs } from "./MapElement";
import { MapElementEditor } from "./MapElementEditor";
import { GRID_SIZE_PX, DEFAULT_CANVAS_SIZE } from "./constants";
import type { BridgeMapElement } from "@thorium/.server/classes/Plugins/Bridge";

const ROTATION_HANDLE_OFFSET = 30;

function getElementBounds(
	el: BridgeMapElement,
	elementScale: number,
): { w: number; h: number } {
	return {
		w: el.widthPixels ?? elementScale,
		h: el.heightPixels ?? elementScale,
	};
}

interface PanState {
	x: number;
	y: number;
	scale: number;
}

type DragMode = "move" | "rotate" | null;

export function MapCanvas({
	pluginId,
	bridgeId,
	floor,
	viewscreens,
	stationNames,
	clientAssignments,
	assignedStations,
	elementScale,
}: {
	pluginId: string;
	bridgeId: string;
	floor: BridgeFloor;
	viewscreens: BridgeViewscreen[];
	stationNames: string[];
	clientAssignments: BridgeClientAssignment[];
	assignedStations: Set<string>;
	elementScale: number;
}) {
	const [activeTool, setActiveTool] = useState<MapTool>("select");
	const panState = useRef<PanState>({ x: 0, y: 0, scale: 1 });
	const svgRef = useRef<SVGSVGElement>(null);
	const activeToolRef = useRef(activeTool);
	activeToolRef.current = activeTool;

	const canvasWidth = floor.backgroundUrl
		? floor.widthPixels
		: DEFAULT_CANVAS_SIZE;
	const canvasHeight = floor.backgroundUrl
		? floor.heightPixels
		: DEFAULT_CANVAS_SIZE;

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
	// Live drag preview — never mutate floor.elements (it's React Query cache).
	const [dragPreview, setDragPreview] = useState<{
		id: string;
		x: number;
		y: number;
		rotation: number;
	} | null>(null);

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const baseSelectedElement = floor.elements.find((e) => e.id === selectedId);
	const selectedElement =
		baseSelectedElement &&
		dragPreview &&
		dragPreview.id === baseSelectedElement.id
			? {
					...baseSelectedElement,
					x: dragPreview.x,
					y: dragPreview.y,
					rotation: dragPreview.rotation,
				}
			: baseSelectedElement;

	const getSvgPoint = useCallback((clientX: number, clientY: number) => {
		const svg = svgRef.current;
		if (!svg) return { x: 0, y: 0 };
		const rect = svg.getBoundingClientRect();
		const x = (clientX - rect.left) / panState.current.scale;
		const y = (clientY - rect.top) / panState.current.scale;
		return { x, y };
	}, []);

	const handleElementMouseDown = useCallback(
		(elementId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			e.preventDefault();
			if (activeTool !== "select") {
				setActiveTool("select");
			}
			setSelectedId(elementId);

			const el = floor.elements.find((el) => el.id === elementId);
			if (!el) return;

			dragMode.current = "move";
			dragElementId.current = elementId;
			dragStart.current = getSvgPoint(e.clientX, e.clientY);
			dragElementStart.current = { x: el.x, y: el.y };
			setDragPreview({
				id: elementId,
				x: el.x,
				y: el.y,
				rotation: el.rotation,
			});
		},
		[activeTool, floor.elements, getSvgPoint],
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
			setDragPreview({
				id: selectedElement.id,
				x: selectedElement.x,
				y: selectedElement.y,
				rotation: selectedElement.rotation,
			});
		},
		[selectedElement, getSvgPoint],
	);

	const handleCanvasMouseMove = useCallback(
		(e: React.MouseEvent<SVGSVGElement>) => {
			if (!dragMode.current || !dragElementId.current) return;
			const pt = getSvgPoint(e.clientX, e.clientY);
			const el = floor.elements.find((el) => el.id === dragElementId.current);
			if (!el) return;

			if (dragMode.current === "move") {
				const dx = pt.x - dragStart.current.x;
				const dy = pt.y - dragStart.current.y;
				setDragPreview({
					id: el.id,
					x: dragElementStart.current.x + dx,
					y: dragElementStart.current.y + dy,
					rotation: el.rotation,
				});
			} else if (dragMode.current === "rotate") {
				// Rotation pivots around the element's static position.
				const angle = Math.atan2(pt.y - el.y, pt.x - el.x);
				const startAngle = Math.atan2(
					dragStart.current.y - el.y,
					dragStart.current.x - el.x,
				);
				const delta = ((angle - startAngle) * 180) / Math.PI;
				setDragPreview({
					id: el.id,
					x: el.x,
					y: el.y,
					rotation: Math.round(dragStartRotation.current + delta),
				});
			}
		},
		[floor.elements, getSvgPoint],
	);

	const handleCanvasMouseUp = useCallback(
		async (e: React.MouseEvent<SVGSVGElement>) => {
			// Finish element drag
			if (dragMode.current && dragElementId.current) {
				const elementId = dragElementId.current;
				const preview = dragPreview;
				dragMode.current = null;
				dragElementId.current = null;
				setDragPreview(null);
				if (preview) {
					await q.plugin.bridge.updateElement.netSend({
						pluginId,
						bridgeId,
						floorId: floor.id,
						elementId,
						x: preview.x,
						y: preview.y,
						rotation: preview.rotation,
					});
				}
				return;
			}

			// Place discrete element
			if (activeTool !== "select") {
				const pt = getSvgPoint(e.clientX, e.clientY);
				await q.plugin.bridge.addElement.netSend({
					pluginId,
					bridgeId,
					floorId: floor.id,
					type: activeTool as BridgeMapElementType,
					x: pt.x,
					y: pt.y,
				});
			}
		},
		[activeTool, pluginId, bridgeId, floor.id, getSvgPoint, dragPreview],
	);

	const handleDeleteElement = useCallback(async () => {
		if (!selectedId) return;
		await q.plugin.bridge.removeElement.netSend({
			pluginId,
			bridgeId,
			floorId: floor.id,
			elementId: selectedId,
		});
		setSelectedId(null);
	}, [selectedId, pluginId, bridgeId, floor.id]);

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
									return (
										<line
											key={`v${i}`}
											x1={pos}
											y1={0}
											x2={pos}
											y2={canvasHeight}
										/>
									);
								},
							)}
							{Array.from(
								{ length: Math.floor(canvasHeight / GRID_SIZE_PX) + 1 },
								(_, i) => {
									const pos = i * GRID_SIZE_PX;
									return (
										<line
											key={`h${i}`}
											x1={0}
											y1={pos}
											x2={canvasWidth}
											y2={pos}
										/>
									);
								},
							)}
						</g>
						{/* Background image */}
						{floor.backgroundUrl && (
							<image
								href={floor.backgroundUrl}
								width={canvasWidth}
								height={canvasHeight}
							/>
						)}

						{/* Elements */}
						{floor.elements.map((el) => {
							const linkedVs =
								el.type === "viewscreen" && el.viewscreenId
									? viewscreens.find((v) => v.id === el.viewscreenId)
									: null;
							const renderEl =
								dragPreview && dragPreview.id === el.id
									? {
											...el,
											x: dragPreview.x,
											y: dragPreview.y,
											rotation: dragPreview.rotation,
										}
									: el;
							return (
								<MapElementRenderer
									key={el.id}
									element={renderEl}
									selected={selectedId === el.id}
									onMouseDown={(e) => handleElementMouseDown(el.id, e)}
									isMainViewscreen={linkedVs?.isMainViewscreen}
									viewscreenName={linkedVs?.name}
									elementScale={elementScale}
								/>
							);
						})}

						{/* Selection overlay: bounding box + rotation handle */}
						{selectedElement &&
							activeTool === "select" &&
							(() => {
								const el = selectedElement;
								const { w, h } = getElementBounds(el, elementScale);
								const hw = w / 2;
								const hh = h / 2;
								return (
									<g
										transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation})`}
										pointerEvents="all"
									>
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
						floorId={floor.id}
						viewscreens={viewscreens}
						stationNames={stationNames}
						assignedStations={assignedStations}
						elementScale={elementScale}
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
