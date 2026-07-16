import type { ElementProps } from "@thorium/cards/EngineeringPanels/elements/ElementProps";

import "./cables.css";
import { q } from "@thorium/context/AppContext";
import useEventListener from "@thorium/hooks/useEventListener";
import { cn } from "@thorium/utils/cn";
import uniqid from "@thorium/utils/uniqid";
import {
	line,
	curveBasis,
	schemeCategory10,
	pairs,
	forceSimulation,
	forceY,
	forceCollide,
	forceLink,
	type Simulation,
} from "d3";
import {
	createContext,
	startTransition,
	Suspense,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type Dispatch,
	type ReactNode,
	type RefObject,
	type SetStateAction,
} from "react";
import { flushSync } from "react-dom";

const CABLE_SEGMENTS = 8;
const HANDLE_R = 9;
const SNAP_RADIUS = 28;
let colorIdx = 0;

const drawLine = line()
	.x(([x]) => x)
	.y(([_, y]) => y)
	.curve(curveBasis);

type Handle = {
	elementId: number | null;
	portIndex: number | null;
};
type ActiveHandle = Handle & {
	x: number;
	y: number;
};
type TCable = {
	id: string;
	color: string;
	handles: [Handle | ActiveHandle, Handle | ActiveHandle];
};

const CablesContext = createContext<{
	setActiveCable: Dispatch<
		SetStateAction<null | {
			cableId: string;
			color: string;
			handles: [ActiveHandle, ActiveHandle];
		}>
	>;
	registerPort: (elementId: number, portIndex: number, rect: DOMRect) => void;
	getPosition: (clientX: number, clientY: number) => { x: number; y: number };
	getPortCenter: (handleId: number, portIndex: number) => { x: number; y: number };
	attach: (cableId: string, x: number, y: number) => Promise<{ x: number; y: number } | null>;
	detach: (cableId: string, handleIndex: number) => void;
}>(null!);

export function CablesWrapper({ children, panelId }: { children: ReactNode; panelId: number }) {
	const cablesRef = useRef<SVGSVGElement>(null);

	const [{ cables }] = q.engineeringPanels.get.useNetRequest({ panelId });

	const [portCache, setPortCache] = useState<Record<string, { x: number; y: number }>>({});

	const getPortCenter = useCallback(
		function getPortCenter(elementId: number, portIndex: number) {
			const key = `${elementId}-${portIndex}`;
			return portCache[key];
		},
		[portCache],
	);

	function findNearestFreePort(
		cables: TCable[],
		x: number,
		y: number,
		excludePort?: { elementId: number; index: number },
	) {
		let best: { elementId: number; index: number; x: number; y: number } | null = null;
		let bestDist = SNAP_RADIUS;
		for (const [key, c] of Object.entries(portCache)) {
			if (!c) continue;
			const [elementId, index] = key.split("-").map((v) => Number(v));
			if (
				Number.isNaN(elementId) ||
				Number.isNaN(index) ||
				(excludePort?.elementId === elementId && excludePort.index === index)
			)
				continue;
			// Ignore ports that already have handles attached to them.
			if (
				cables.some((c) =>
					c.handles.some((h) => h.elementId === elementId && h.portIndex === index),
				)
			)
				continue;
			const d = Math.hypot(c.x - x, c.y - y);
			if (d < bestDist) {
				bestDist = d;
				best = { elementId, index, ...getPortCenter(elementId, index) };
			}
		}
		return best;
	}

	const [activeCable, setActiveCable] = useState<null | {
		cableId: string;
		color: string;
		handles: [ActiveHandle, ActiveHandle];
	}>(null);

	useEffect(() => {
		const el = cablesRef.current;
		if (!el) return;
		const observer = new ResizeObserver(() => {
			setPortCache({});
		});

		observer.observe(el);

		return () => {
			observer.unobserve(el);
		};
	}, []);

	return (
		<CablesContext
			value={useMemo(
				() => ({
					setActiveCable,
					getPortCenter,
					registerPort(elementId, portIndex, portRect) {
						const key = `${elementId}-${portIndex}`;
						if (!cablesRef.current || portCache[key]) return;
						const wrapRect = cablesRef.current.getBoundingClientRect();
						setPortCache((c) => ({
							...c,
							[key]: {
								x: portRect.left + portRect.width / 2 - wrapRect.left,
								y: portRect.top + portRect.height / 2 - wrapRect.top,
							},
						}));
					},
					getPosition(clientX: number, clientY: number) {
						const wrapRect = cablesRef.current!.getBoundingClientRect();
						const mx = clientX - wrapRect.left;
						const my = clientY - wrapRect.top;
						return { x: mx, y: my };
					},
					attach: async (cableId, x, y) => {
						const wrapRect = cablesRef.current!.getBoundingClientRect();
						const mx = x - wrapRect.left;
						const my = y - wrapRect.top;
						let port = findNearestFreePort(cables, mx, my);
						if (!port) {
							setActiveCable(null);
							await q.engineeringPanels.removeCable.netSend({
								panelId,
								cableId,
							});
							return null;
						}
						if (!activeCable) {
							return null;
						}
						if (cables.some((c) => c.id === cableId)) {
							await q.engineeringPanels.updateCable.netSend({
								panelId,
								cableId,
								handles: [
									{
										elementId: activeCable.handles[0].elementId ?? port.elementId,
										portIndex: activeCable.handles[0].portIndex ?? port.index,
									},
									{
										elementId: activeCable.handles[1].elementId ?? port.elementId,
										portIndex: activeCable.handles[1].portIndex ?? port.index,
									},
								],
							});
						} else {
							await q.engineeringPanels.addCable.netSend({
								panelId,
								cableId,
								color: activeCable.color,
								handles: [
									{
										elementId: activeCable.handles[0].elementId ?? port.elementId,
										portIndex: activeCable.handles[0].portIndex ?? port.index,
									},
									{
										elementId: activeCable.handles[1].elementId ?? port.elementId,
										portIndex: activeCable.handles[1].portIndex ?? port.index,
									},
								],
							});
						}
						setActiveCable(null);

						return port;
					},
					detach: async (cableId, handleIndex) => {
						const cable = cables.find((c) => c.id === cableId);
						if (!cable) return;
						const handle1Port = getPortCenter(
							cable.handles[0].elementId,
							cable.handles[0].portIndex,
						);
						const handle2Port = getPortCenter(
							cable.handles[1].elementId,
							cable.handles[1].portIndex,
						);
						const handles: [ActiveHandle, ActiveHandle] = [
							{ ...cable.handles[0], ...handle1Port },
							{ ...cable.handles[1], ...handle2Port },
						];
						handles[handleIndex].elementId = null!;
						handles[handleIndex].portIndex = null!;
						setActiveCable({
							cableId,
							color: cable.color,
							handles,
						});
					},
				}),
				[activeCable, getPortCenter],
			)}
		>
			<Suspense>
				<svg id="cables" ref={cablesRef}>
					{activeCable && !cables.some((c) => c.id === activeCable?.cableId) ? (
						<Cable id={activeCable.cableId} {...activeCable} />
					) : null}
					{cables.map((c) => (
						<Cable key={c.id} {...c} />
					))}
				</svg>
			</Suspense>
			{children}
		</CablesContext>
	);
}

class StartCableDrag extends Event {
	static name = "start-cable-drag";
	constructor(public id: string) {
		super(StartCableDrag.name);
	}
}

export function Cables({
	elementId,
	ports = 4,
	className,
}: { ports?: number; className?: string } & ElementProps) {
	const { setActiveCable } = use(CablesContext);
	return (
		<div
			className={cn(
				"port-holder gap-2 w-full h-full items-center",
				{
					grid: ports === 1 || ports === 2,
					"grid grid-cols-3": ports === 3 || ports === 6 || ports === 9,
					"grid grid-cols-4": ports === 4 || ports === 8,
					"grid grid-cols-5": ports === 10,
					"flex space-between": ports === 5 || ports === 7,
				},
				className,
			)}
		>
			{Array.from({ length: ports }).map((_, i) => (
				<CablePort
					key={i}
					index={i}
					elementId={elementId}
					createCable={({ x, y }: { x: number; y: number }) => {
						const id = uniqid("cbl-");
						flushSync(() => {
							setActiveCable({
								cableId: id,
								color: schemeCategory10[colorIdx % 10],
								handles: [
									{ x, y, elementId, portIndex: i },
									{ x, y, elementId: null, portIndex: null },
								],
							});
							colorIdx++;
						});
						window.dispatchEvent(new StartCableDrag(id));
					}}
				/>
			))}
		</div>
	);
}

function Cable({ id, handles, color }: TCable) {
	const pathRef = useRef<SVGPathElement>(null);
	const { getPortCenter } = use(CablesContext);
	const nodes = useMemo(() => {
		const nodes: { x: number; y: number; fx?: number; fy?: number }[] = [];

		let handle0x = 0;
		let handle0y = 0;
		if ("x" in handles[0]) {
			nodes.push({ x: handles[0].x, y: handles[0].y, fx: handles[0].x, fy: handles[0].y });
			handle0x = handles[0].x;
			handle0y = handles[0].y;
		} else if (handles[0].elementId !== null && handles[0].portIndex !== null) {
			const portLocation = getPortCenter(handles[0].elementId, handles[0].portIndex);
			if (!portLocation) return [];
			nodes.push({
				x: portLocation.x,
				y: portLocation.y,
				fx: portLocation.x,
				fy: portLocation.y,
			});
			handle0x = portLocation.x;
			handle0y = portLocation.y;
		}
		for (let i = 0; i < CABLE_SEGMENTS - 1; i++) {
			nodes.push({ x: handle0x, y: handle0y });
		}
		if ("x" in handles[1]) {
			nodes.push({ x: handles[1].x, y: handles[1].y, fx: handles[1].x, fy: handles[1].y });
		} else if (handles[1].elementId !== null && handles[1].portIndex !== null) {
			const portLocation = getPortCenter(handles[1].elementId, handles[1].portIndex);
			if (!portLocation) return [];
			nodes.push({
				x: portLocation.x,
				y: portLocation.y,
				fx: portLocation.x,
				fy: portLocation.y,
			});
		}

		return nodes;
	}, [getPortCenter]);

	const sim = useRef<
		Simulation<
			{
				x: number;
				y: number;
				fx?: number;
				fy?: number;
			},
			undefined
		>
	>(
		forceSimulation(nodes)
			.force("gravity", forceY(1000).strength(0.001))
			.force("collide", forceCollide(2))
			.force(
				"links",
				forceLink(pairs(nodes).map(([source, target]) => ({ source, target }))).strength(0.9),
			)
			.on("tick", () =>
				pathRef.current?.setAttribute("d", drawLine(nodes.map((n) => [n.x, n.y])) || ""),
			),
	);

	useEffect(() => {
		return () => {
			sim.current.stop();
		};
	}, [sim]);

	const updateSim = useCallback(() => {
		const startNode = nodes[0];
		const endNode = nodes.at(-1);
		if (!endNode || !("fx" in startNode) || !("fx" in endNode)) return;
		const dist = Math.hypot(
			(endNode.fx ?? endNode.x) - (startNode.fx ?? startNode.x),
			(endNode.fy ?? endNode.y) - (startNode.fy ?? startNode.y),
		);
		// @ts-expect-error
		sim.current?.force("links")?.distance(dist / CABLE_SEGMENTS);
		sim.current?.alpha(0.5).restart();
	}, []);

	const { attach, detach } = use(CablesContext);

	return (
		<>
			<path className="cable" stroke={color} ref={pathRef} />
			{handles.map((h, i) => {
				return (
					<CableHandle
						cableId={id}
						key={i}
						color={color}
						{...h}
						x={"x" in h ? h.x : (i === 0 ? nodes.at(0)?.x : nodes.at(-1)?.x) || 0}
						y={("y" in h ? h.y : i === 0 ? nodes.at(0)?.y : nodes.at(-1)?.y) || 0}
						isActiveHandle={h.elementId === null}
						detach={() => {
							detach(id, i);
						}}
						attach={async (x, y) => attach(id, x, y)}
						updateSim={(x, y) => {
							if (i === 0) {
								nodes[0].fx = x;
								nodes[0].fy = y;
							}
							const endNode = nodes.at(-1);
							if (i === 1 && endNode) {
								endNode.fx = x;
								endNode.fy = y;
							}
							updateSim();
						}}
					/>
				);
			})}
		</>
	);
}

function CablePort({
	elementId,
	createCable,
	index,
}: {
	index: number;
	elementId: number;
	createCable: ({ x, y }: { x: number; y: number }) => void;
}) {
	const { getPortCenter, registerPort } = use(CablesContext);

	return (
		<div className="flex flex-col items-center gap-1">
			<div
				data-elementid={elementId}
				data-index={index}
				ref={(el) => {
					if (el) {
						registerPort(elementId, index, el.getBoundingClientRect());
					}
				}}
				className="cable-port"
				onPointerDown={(event) => {
					event.preventDefault();

					const portCenter = getPortCenter(elementId, index);
					createCable(portCenter);
				}}
			></div>
			{index + 1}
		</div>
	);
}

function startCableDrag(
	target: SVGElement,
	getPosition: (
		clientX: number,
		clientY: number,
	) => {
		x: number;
		y: number;
	},
	updateSim: (x: number, y: number) => void,
	attach: RefObject<(x: number, y: number) => Promise<{ x: number; y: number } | null>>,
) {
	const abortController = new AbortController();
	document.addEventListener(
		"pointermove",
		(event) => {
			const { x, y } = getPosition(event.clientX, event.clientY);
			target.setAttribute("transform", `translate(${x}, ${y})`);
			updateSim(x, y);
		},
		{ signal: abortController.signal },
	);
	document.addEventListener(
		"pointerup",
		async (event) => {
			startTransition(async () => {
				const port = await attach.current(event.clientX, event.clientY);
				if (port) {
					target.setAttribute("transform", `translate(${port.x}, ${port.y})`);
					updateSim(port.x, port.y);
				}
				abortController.abort();
			});
		},
		{ once: true },
	);
}

function CableHandle({
	cableId,
	x,
	y,
	detach,
	attach,
	color,
	updateSim,
	isActiveHandle,
}: {
	cableId: string;
	x: number;
	y: number;
	detach: () => void;
	attach: (x: number, y: number) => Promise<{ x: number; y: number } | null>;
	color: string;
	updateSim: (x: number, y: number) => void;
	isActiveHandle: boolean;
}) {
	const attachRef = useRef(attach);
	useEffect(() => {
		attachRef.current = attach;
	}, [attach]);

	const groupRef = useRef<SVGGElement>(null);
	const { getPosition } = use(CablesContext);
	useEventListener(StartCableDrag.name, (event: StartCableDrag) => {
		if (isActiveHandle && cableId === event.id && groupRef.current) {
			startCableDrag(groupRef.current, getPosition, updateSim, attachRef);
		}
	});
	return (
		<g
			className="handle-group"
			ref={groupRef}
			transform={`translate(${x}, ${y})`}
			onPointerDown={(e) => {
				detach();
				const target = e.currentTarget;
				startCableDrag(target, getPosition, updateSim, attachRef);
			}}
		>
			<circle className="handle-ring" r={HANDLE_R + 5} stroke={color} />
			<circle className="handle" r={HANDLE_R} stroke={color} />
			<circle r={3} fill={color} style={{ pointerEvents: "none" }} />
		</g>
	);
}
