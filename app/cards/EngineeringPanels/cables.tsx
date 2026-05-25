import "./cables.css";
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
import { produce } from "immer";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from "react";

const CABLE_SEGMENTS = 8;
const HANDLE_R = 9;
const SNAP_RADIUS = 28;
let colorIdx = 0;

const drawLine = line()
	.x(([x]) => x)
	.y(([_, y]) => y)
	.curve(curveBasis);

type Handle = { x: number; y: number; fx?: number; fy?: number; port?: string | null };
type TCable = { id: string; color: string; handles: [Handle, Handle] };

const CablesContext = createContext<{
	setCables: Dispatch<SetStateAction<TCable[]>>;
	getPosition: (clientX: number, clientY: number) => { x: number; y: number };
	setHandle: (cableId: string, handleIndex: number, clientX: number, clientY: number) => void;
	getPortCenter: (el: Element) => { x: number; y: number };
	attach: (
		cableId: string,
		handleIndex: number,
		x: number,
		y: number,
	) => { x: number; y: number } | null;
	detach: (cableId: string, handleIndex: number) => void;
}>(null!);

export function CablesWrapper({ children }: { children: ReactNode }) {
	const cablesRef = useRef<SVGSVGElement>(null);

	function getPortCenter(el: Element) {
		const wrapRect = cablesRef.current!.getBoundingClientRect();
		const portRect = el.getBoundingClientRect();
		return {
			x: portRect.left + portRect.width / 2 - wrapRect.left,
			y: portRect.top + portRect.height / 2 - wrapRect.top,
		};
	}

	function findNearestFreePort(cables: TCable[], x: number, y: number, excludePort?: string) {
		let best: { id: string; x: number; y: number } | null = null;
		let bestDist = SNAP_RADIUS;
		for (const el of document.querySelectorAll(".cable-port") as NodeListOf<HTMLElement>) {
			const portId = el.dataset.portid;
			if (!portId || portId === excludePort) continue;
			// Ignore ports that already have handles attached to them.
			if (cables.some((c) => c.handles.some((h) => h.port === portId))) continue;
			const c = getPortCenter(el);
			const d = Math.hypot(c.x - x, c.y - y);
			if (d < bestDist) {
				bestDist = d;
				best = { id: portId, ...getPortCenter(el) };
			}
		}
		return best;
	}

	const [cables, setCables] = useState<TCable[]>([]);

	return (
		<CablesContext
			value={useMemo(
				() => ({
					setCables,
					getPortCenter,
					getPosition(clientX: number, clientY: number) {
						const wrapRect = cablesRef.current!.getBoundingClientRect();
						const mx = clientX - wrapRect.left;
						const my = clientY - wrapRect.top;
						return { x: mx, y: my };
					},
					setHandle(cableId, handleIndex, clientX, clientY) {
						const wrapRect = cablesRef.current!.getBoundingClientRect();
						const mx = clientX - wrapRect.left;
						const my = clientY - wrapRect.top;

						setCables(
							produce((draft) => {
								draft.forEach((c) => {
									if (c.id !== cableId) return;
									c.handles[handleIndex].x = mx;
									c.handles[handleIndex].y = my;
								});
							}),
						);

						return { x: mx, y: my };
					},
					attach: (cableId, handleIndex, x, y) => {
						const wrapRect = cablesRef.current!.getBoundingClientRect();
						const mx = x - wrapRect.left;
						const my = y - wrapRect.top;
						let port: {
							id: string;
							x: number;
							y: number;
						} | null = null;
						setCables((cables) => {
							port = findNearestFreePort(cables, mx, my);

							if (!port) {
								// Remove the cable altogether
								return cables.filter((c) => c.id !== cableId);
							}

							return produce(cables, (draft) => {
								draft.forEach((cable) => {
									if (cable.id === cableId) {
										cable.handles[handleIndex].port = port!.id;
									}
								});
							});
						});

						return port;
					},
					detach: (cableId, handleIndex) => {
						setCables(
							produce((draft) => {
								draft.forEach((cable) => {
									if (cable.id === cableId) {
										cable.handles[handleIndex].port = null;
									}
								});
							}),
						);
					},
				}),
				[],
			)}
		>
			<svg id="cables" ref={cablesRef}>
				{cables.map((c) => (
					<Cable key={c.id} {...c} />
				))}
			</svg>
			{children}
		</CablesContext>
	);
}

export function Cables({ ports = 4 }: { ports?: number }) {
	const { setCables, setHandle, attach } = use(CablesContext);
	const id = useId();
	return (
		<div className="port-holder">
			{Array.from({ length: ports }).map((_, i) => (
				<CablePort
					key={i}
					cellId={id}
					id={`${i}`}
					createCable={(portId, { x, y }: { x: number; y: number }) => {
						const id = uniqid("cbl-");
						setCables((c) => [
							...c,
							{
								id,
								color: schemeCategory10[colorIdx % 10],
								handles: [
									{ x, y, port: portId },
									{ x, y },
								],
							},
						]);
						colorIdx++;

						const abortController = new AbortController();
						document.addEventListener(
							"pointermove",
							(event) => {
								setHandle(id, 1, event.clientX, event.clientY);
							},
							{ signal: abortController.signal },
						);
						document.addEventListener(
							"pointerup",
							(event) => {
								const port = attach(id, 1, event.clientX, event.clientY);
								if (port) {
									setCables(
										produce((draft) => {
											draft.forEach((c) => {
												if (c.id !== id) return;
												c.handles[1].x = port.x;
												c.handles[1].y = port.y;
											});
										}),
									);
								}
								abortController.abort();
							},
							{ once: true },
						);
					}}
				/>
			))}
		</div>
	);
}

function Cable({ id, handles, color }: TCable) {
	const pathRef = useRef<SVGPathElement>(null);
	const nodes = useRef<{ x: number; y: number; fx?: number; fy?: number }[]>([
		{ x: handles[0].x, y: handles[0].y, fx: handles[0].x, fy: handles[0].y },
		...Array.from({ length: CABLE_SEGMENTS - 1 }).map(() => ({ x: handles[0].x, y: handles[0].y })),
		{ x: handles[1].x, y: handles[1].y, fx: handles[1].x, fy: handles[1].y },
	]);
	const [sim, setSim] = useState<Simulation<
		{
			x: number;
			y: number;
			fx?: number;
			fy?: number;
		},
		undefined
	> | null>(null);

	useEffect(() => {
		const links = pairs(nodes.current).map(([source, target]) => ({ source, target }));
		const sim = forceSimulation(nodes.current)
			.force("gravity", forceY(2000).strength(0.001))
			.force("collide", forceCollide(2))
			.force("links", forceLink(links).strength(0.9))
			.on("tick", () =>
				pathRef.current?.setAttribute("d", drawLine(nodes.current.map((n) => [n.x, n.y])) || ""),
			);
		setSim(sim);
		return () => {
			sim.stop();
		};
	}, [sim]);

	const updateSim = useCallback(() => {
		const startNode = nodes.current[0];
		const endNode = nodes.current.at(-1);
		if (!endNode || !("fx" in startNode) || !("fx" in endNode)) return;
		const dist = Math.hypot(
			(endNode.fx ?? endNode.x) - (startNode.fx ?? startNode.x),
			(endNode.fy ?? endNode.y) - (startNode.fy ?? startNode.y),
		);
		// @ts-expect-error
		sim?.force("links")?.distance(dist / CABLE_SEGMENTS);
		sim?.alpha(0.5).restart();
	}, []);

	useEffect(() => {
		const startNode = nodes.current[0];
		const endNode = nodes.current.at(-1);
		if ("fx" in startNode) {
			startNode.x = handles[0].x;
			startNode.fx = handles[0].x;
			startNode.y = handles[0].y;
			startNode.fy = handles[0].y;
		}
		if (endNode && "fx" in endNode) {
			endNode.x = handles[1].x;
			endNode.fx = handles[1].x;
			endNode.y = handles[1].y;
			endNode.fy = handles[1].y;
		}
		updateSim();
	}, [handles[0].x, handles[0].y, handles[1].x, handles[1].y]);

	const { attach, detach } = use(CablesContext);

	return (
		<>
			<path className="cable" stroke={color} ref={pathRef} />
			{handles.map((h, i) => (
				<CableHandle
					key={i}
					color={color}
					{...h}
					detach={() => {
						detach(id, i);
					}}
					attach={(x: number, y: number) => attach(id, i, x, y)}
					updateSim={(x, y) => {
						if (i === 0) {
							nodes.current[0].fx = x;
							nodes.current[0].fy = y;
						}
						const endNode = nodes.current.at(-1);
						if (i === 1 && endNode) {
							endNode.fx = x;
							endNode.fy = y;
						}
						updateSim();
					}}
				/>
			))}
		</>
	);
}

function CablePort({
	id,
	cellId,
	createCable,
}: {
	id: string;
	cellId: string;
	createCable: (id: string, { x, y }: { x: number; y: number }) => void;
}) {
	const { getPortCenter } = use(CablesContext);
	return (
		<div
			data-portid={`${cellId}-${id}`}
			className="cable-port"
			onPointerDown={(event) => {
				const portEl = event.currentTarget;
				event.preventDefault();

				const portCenter = getPortCenter(portEl);
				createCable(id, portCenter);
			}}
		></div>
	);
}

function CableHandle({
	x,
	y,
	detach,
	attach,
	color,
	updateSim,
}: {
	x: number;
	y: number;
	detach: () => void;
	attach: (x: number, y: number) => { x: number; y: number } | null;
	color: string;
	updateSim: (x: number, y: number) => void;
}) {
	const { getPosition } = use(CablesContext);
	const groupRef = useRef<SVGGElement>(null);
	return (
		<g
			className="handle-group"
			ref={groupRef}
			transform={`translate(${x}, ${y})`}
			onPointerDown={() => {
				detach();

				const abortController = new AbortController();
				document.addEventListener(
					"pointermove",
					(event) => {
						if (!groupRef.current) return;
						const { x, y } = getPosition(event.clientX, event.clientY);
						groupRef.current.setAttribute("transform", `translate(${x}, ${y})`);
						updateSim(x, y);
					},
					{ signal: abortController.signal },
				);
				document.addEventListener(
					"pointerup",
					(event) => {
						const port = attach(event.clientX, event.clientY);
						if (groupRef.current && port) {
							groupRef.current.setAttribute("transform", `translate(${port.x}, ${port.y})`);
							updateSim(port.x, port.y);
						}
						abortController.abort();
					},
					{ once: true },
				);
			}}
		>
			<circle className="handle-ring" r={HANDLE_R + 5} stroke={color} />
			<circle className="handle" r={HANDLE_R} stroke={color} />
			<circle r={3} fill={color} style={{ pointerEvents: "none" }} />
		</g>
	);
}
