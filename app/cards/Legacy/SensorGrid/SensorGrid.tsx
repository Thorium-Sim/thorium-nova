import { sensorsSpeeds, useSensorsStore } from "./useSensorsStore";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { cn } from "@thorium/utils/cn";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import {
	Suspense,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
	type DetailedHTMLProps,
	type HTMLAttributes,
	type PointerEvent,
	type RefObject,
} from "react";
import { Menu, MenuItem, Popover, Separator } from "react-aria-components";
import maskUrl from "./mask.svg?url";
import { Explosion } from "@thorium/cards/Legacy/SensorGrid/Explosion";
import chroma from "chroma-js";
import "./style.css";
import { useQueryClient } from "@tanstack/react-query";

export function SensorGrid({
	gridRef,
	draggingRef,
	dragging,
	className,
	onContactHover,
	onGridHover,
}: {
	className?: string;
	dragging?: number | "planet" | "border" | "ping" | null;
	gridRef: RefObject<HTMLDivElement | null>;
	draggingRef?: RefObject<HTMLDivElement | null>;
	onGridHover?: () => void;
	onContactHover?: (name: string, picture: string | null) => void;
}) {
	const { station, shipId } = useStation();
	const [armyContacts] = q.legacy.sensorGrid.armyContacts.useNetRequest({
		shipId,
	});
	const [sensors] = q.legacy.sensorGrid.sensors.useNetRequest({ shipId });
	const contactsRef = useRef<HTMLDivElement>(null);
	q.legacy.sensorGrid.sonarPing.useNetRequest(
		{ shipId },
		{
			callback(data) {
				if (!data) return;
				gridRef.current?.classList.remove("ping");
				contactsRef.current?.classList.add("can-hover");
				requestAnimationFrame(() => {
					gridRef.current?.classList.add("ping");
				});
				setTimeout(() => {
					contactsRef.current?.classList.remove("can-hover");
				}, 5200);
			},
		},
	);
	q.legacy.sensorGrid.stream.useDataStream({ shipId });

	const sensorsStore = useSensorsStore();

	const isCore = station.name === "Flight Director";
	const draggingContact = !dragging
		? null
		: typeof dragging === "number"
			? armyContacts.find((c) => c.id === dragging)
			: sensorsStore[dragging];

	return (
		<div
			className={cn(
				"aspect-square max-h-full max-w-full rounded-full",
				className,
			)}
			onClick={() => useSensorsStore.setState({ selectedContact: null })}
		>
			<div
				className={cn(
					"aspect-square relative max-h-full max-w-full rounded-full",
					{
						"sonar-background": sensors.pingActive,
						"is-core": isCore,
					},
				)}
				ref={gridRef}
				onPointerMove={onGridHover}
			>
				<div className="absolute flex items-center justify-center w-full h-full z-20  pointer-events-none">
					<div ref={draggingRef} className="absolute w-full h-full">
						{dragging && draggingContact ? (
							<ContactImage
								color={draggingContact.color}
								icon={draggingContact.icon}
								type={typeof dragging === "number" ? "contact" : dragging}
								size={draggingContact.size}
							/>
						) : null}
					</div>
				</div>
				<div
					ref={contactsRef}
					className="absolute flex items-center justify-center w-full h-full z-0 pointer-events-none sensor-contacts"
				>
					<SensorContacts gridRef={gridRef} onContactHover={onContactHover} />
				</div>
				<GridLines />
				<GridSegments />
				<Interference interference={sensors.interference} />
			</div>
		</div>
	);
}

export function Interference({ interference }: { interference: number }) {
	const { cardLoaded } = useCardContext();
	const { station } = useStation();
	const isCore = station.name === "Flight Director";
	const ref = useRef<HTMLCanvasElement>(null);
	const ctx = ref.current?.getContext("2d");

	useEffect(() => {
		if (ref.current) {
			const dims = ref.current.getBoundingClientRect();
			ref.current.width = dims.width;
			ref.current.height = dims.height;
		}
	}, []);
	useAnimationFrame(
		() => {
			if (!ctx) return;
			const w = ctx.canvas.width;
			const h = ctx.canvas.height;
			const image = ctx.createImageData(w, h);
			for (let i = 0; i < image.data.length; i += 4) {
				const val = 255 * Math.random();
				image.data[i] = val;
				image.data[i + 1] = val;
				image.data[i + 2] = val;
				image.data[i + 3] = 255;
			}
			ctx.putImageData(image, 0, 0);
		},
		cardLoaded && interference > 0,
	);

	return (
		<canvas
			ref={ref}
			className={cn("absolute top-0 w-full h-full bg-white rounded-full", {
				"pointer-events-none": interference < 0.5 || isCore,
			})}
			style={{
				opacity: interference * (isCore ? 0.5 : 1),
			}}
		/>
	);
}

const destinationMap = new Map<number, { x: number; y: number }>();
export function SensorContacts({
	gridRef,
	onContactHover,
}: {
	gridRef: RefObject<HTMLDivElement | null>;
	onContactHover?: (name: string, picture: string | null) => void;
}) {
	const { shipId } = useStation();

	const [contacts] = q.legacy.sensorGrid.sensorContacts.useNetRequest({
		shipId,
	});

	q.legacy.sensorGrid.sensorContactsDestination.useNetSubscribe(
		{
			shipId,
		},

		(data) => {
			destinationMap.clear();
			for (const [id, destination] of data) {
				destinationMap.set(id, destination);
			}
		},
	);

	return contacts.map((c) => (
		<SensorContact
			key={c.id}
			{...c}
			destination={c.destination}
			gridRef={gridRef}
			onPointerMove={(event) => {
				if (onContactHover) {
					event.stopPropagation();
				}
				onContactHover?.(c.name, c.picture);
			}}
		/>
	));
}

function SensorContact({
	id,
	name,
	position,
	destination,
	size,
	gridRef,
	destroyed,
	frozenState,
	onPointerMove,
	...props
}: {
	id: number;
	name: string;
	type: "contact" | "border" | "planet" | "ping" | "projectile";
	color: string;
	size: number;
	icon: string;
	position: { x: number; y: number };
	destination: { x: number; y: number };
	disabled: boolean;
	hostile: boolean;
	destroyed: boolean;
	frozenState: any;
	gridRef: RefObject<HTMLDivElement | null>;
	onPointerMove?: (event: PointerEvent) => void;
}) {
	const { station, shipId } = useStation();
	const isCore = station.name === "Flight Director";
	const iconRef = useRef<HTMLDivElement>(null);
	const contactRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const draggingRef = useRef(false);
	const { interpolate } = useLiveQuery();
	const { cardLoaded } = useCardContext();
	const [pickingSpeed, setPickingSpeed] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const sensorsStore = useSensorsStore();
	const [sensors] = q.legacy.sensorGrid.sensors.useNetRequest({ shipId });

	useAnimationFrame(() => {
		const position = interpolate(id);

		if (iconRef.current && !draggingRef.current) {
			const dest = destinationMap.get(id);
			iconRef.current.style.transform = `translate(${(frozenState?.destination?.x ?? dest?.x ?? destination.x) * 100}%, ${(frozenState?.destination?.y ?? dest?.y ?? destination.y) * 100}%)`;
			iconRef.current.style.opacity = "1";
		}
		if (!position || !contactRef.current) return;
		contactRef.current.style.transform = `translate(${position.x * 100}%, ${position.y * 100}%)`;
		contactRef.current.style.opacity = "1";
	}, cardLoaded);

	async function pickSpeed(speed: number) {
		if (pickingSpeed) {
			await q.legacy.sensorGrid.updateContact.netSend({
				contactId: id,
				destination: pickingSpeed,
				speed,
			});
		}
		setPickingSpeed(null);
		draggingRef.current = false;
	}

	function handleDrag(event: PointerEvent) {
		event.stopPropagation();

		const iconDimensions = iconRef.current?.getBoundingClientRect();
		if (!iconDimensions) return;

		const offset = [
			iconDimensions.left - event.clientX,
			iconDimensions.top - event.clientY,
		];
		const abortController = new AbortController();
		const dimensions = gridRef.current?.getBoundingClientRect();

		if (!dimensions) return;

		document.addEventListener(
			"pointermove",
			(moveEvent) => {
				if (
					Math.hypot(
						moveEvent.clientX - event.clientX,
						moveEvent.clientY - event.clientY,
					) < 2
				) {
					return;
				}
				draggingRef.current = true;
				const x =
					(moveEvent.clientX + offset[0] - dimensions.left) / dimensions.width;
				const y =
					(moveEvent.clientY + offset[1] - dimensions.top) / dimensions.height;
				if (iconRef.current) {
					iconRef.current.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
				}
			},
			{ signal: abortController.signal },
		);
		document.addEventListener(
			"pointerup",
			async (upEvent) => {
				abortController.abort();

				if (
					Math.hypot(
						upEvent.clientX - event.clientX,
						upEvent.clientY - event.clientY,
					) < 2
				) {
					useSensorsStore.setState({ selectedContact: id });
					draggingRef.current = false;
					return;
				}
				const x =
					(upEvent.clientX + offset[0] - dimensions.left) / dimensions.width;
				const y =
					(upEvent.clientY + offset[1] - dimensions.top) / dimensions.height;

				// Check if the contact is within the sensor grid area
				const gridParentDimensions =
					gridRef.current?.parentElement?.getBoundingClientRect();
				const draggingDimensions =
					iconRef.current?.children[0]?.getBoundingClientRect();
				if (
					draggingDimensions &&
					gridParentDimensions &&
					(draggingDimensions.left > gridParentDimensions.right ||
						draggingDimensions.right < gridParentDimensions.left ||
						draggingDimensions.top > gridParentDimensions.bottom ||
						draggingDimensions.bottom < gridParentDimensions.top)
				) {
					await q.legacy.sensorGrid.updateContact.netSend({
						contactId: id,
						destination: { x, y },
						speed: sensors.defaultSpeed,
					});
					q.legacy.sensorGrid.removeContact.netSend({
						contactId: id,
					});
					draggingRef.current = false;

					return;
				}
				if (sensorsStore.askForSpeed) {
					setPickingSpeed({ x, y });
				} else {
					await q.legacy.sensorGrid.updateContact.netSend({
						contactId: id,
						destination: { x, y },
						speed: sensors.defaultSpeed,
					});
					draggingRef.current = false;
				}
			},
			{ once: true },
		);
	}
	return (
		<>
			{frozenState?.new ? null : (
				<div
					className="absolute w-full h-full pointer-events-none select-none opacity-0"
					ref={contactRef}
					style={{
						transform: `translate(${position.x * 100}%, ${position.y * 100}%)`,
					}}
				>
					{destroyed ? (
						<Explosion
							className="w-[5%] h-[5%]"
							style={{ transform: `translate(-50%, -50%) scale(${size})` }}
						/>
					) : (
						<ContactImage
							size={size}
							isGhost={isCore}
							{...props}
							onPointerMove={onPointerMove}
						/>
					)}
				</div>
			)}
			{isCore && !destroyed ? (
				<div
					className="absolute w-full h-full pointer-events-none select-none opacity-0"
					ref={iconRef}
				>
					{sensorsStore.showContactLabels && (
						<p className="w-min text-nowrap select-none absolute border-white/20 border bg-black text-xs px-1 pointer-events-none z-10 left-1 top-1">
							{frozenState?.name ?? name}
						</p>
					)}
					{sensorsStore.selectedContact === id ? (
						<div
							className="absolute top-0 left-0 w-[2.5%] h-[2.5%] origin-top-left"
							style={{ transform: `scale(${frozenState?.size ?? size})` }}
						>
							<div className="absolute border-t-2 border-l-2 w-full h-full border-blue-500 -translate-x-[120%] -translate-y-[120%]" />
							<div className="absolute border-b-2 border-l-2 w-full h-full border-blue-500 -translate-x-[120%] translate-y-[20%]" />
							<div className="absolute border-b-2 border-r-2 w-full h-full border-blue-500 translate-x-[20%] translate-y-[20%]" />
							<div className="absolute border-t-2 border-r-2 w-full h-full border-blue-500 translate-x-[20%] -translate-y-[120%]" />
						</div>
					) : null}
					<ContactImage
						size={size}
						ref={triggerRef}
						{...props}
						{...frozenState}
						onPointerDown={handleDrag}
					/>
					<Popover
						isOpen={!!pickingSpeed}
						triggerRef={triggerRef}
						onOpenChange={() => {
							setPickingSpeed(null);
							draggingRef.current = false;
						}}
						crossOffset={100}
					>
						<Menu className="text-xs text-white bg-gray-900">
							{sensorsSpeeds.map((speed) => (
								<MenuItem key={speed.id} onAction={() => pickSpeed(speed.id)}>
									{speed.label}
								</MenuItem>
							))}
							<Separator className="border-b border-white" />
							<MenuItem
								onAction={() => {
									setPickingSpeed(null);
									draggingRef.current = false;
								}}
							>
								Cancel
							</MenuItem>
							<MenuItem
								onAction={() => {
									q.legacy.sensorGrid.removeContact.netSend({ contactId: id });
									setPickingSpeed(null);
								}}
							>
								Remove
							</MenuItem>
							<MenuItem
								onAction={async () => {
									await q.legacy.sensorGrid.updateContact.netSend({
										contactId: id,
										destroyed: true,
									});
									setPickingSpeed(null);
									draggingRef.current = false;
								}}
							>
								Destroy
							</MenuItem>
						</Menu>
					</Popover>
				</div>
			) : null}
		</>
	);
}

export function ContactImage({
	type,
	icon,
	color,
	disabled,
	size,
	hostile,
	ref,
	isGhost,
	...props
}: {
	type: "contact" | "border" | "ping" | "planet" | "projectile";
	icon: string;
	color: string;
	size: number;
	hostile?: boolean;
	disabled?: boolean;
	ref?: RefObject<HTMLDivElement | null>;
	isGhost?: boolean;
	dimmed?: boolean;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
	const { station } = useStation();
	const isCore = station.name === "Flight Director";

	if (type === "contact") {
		return (
			<Suspense>
				<SVGImageLoader
					url={icon}
					ref={ref}
					{...props}
					onLoad={() => {}}
					className={cn(
						"w-[5%] h-[5%] object-contain cursor-pointer pointer-events-auto",
						{
							"opacity-50": isGhost,
							"drop-shadow-[0_0_3px_red]": hostile,
						},
					)}
					style={{
						color: color,
						transform: `translate(-50%, -50%) scale(${size})`,
						...(disabled
							? { maskImage: `url("${maskUrl}")`, maskSize: `${2 / size}px` }
							: {}),
					}}
				/>
			</Suspense>
		);
	}
	if (type === "planet") {
		return (
			<div
				ref={ref}
				{...props}
				className={cn(
					"w-[5%] h-[5%] bg-white border border-gray-300 rounded-full pointer-events-auto",
					{
						"opacity-60": isCore,
						"opacity-30": isGhost,
					},
				)}
				style={{
					transform: `translate(-50%, -50%) scale(${size * 20})`,
					backgroundColor: color,
					borderColor: chroma(color).darken().css("rgb"),
				}}
			/>
		);
	}
	if (type === "border") {
		return (
			<div
				ref={ref}
				{...props}
				className={cn(
					"h-[3%] w-[150%] bg-white border-4 border-gray-300 -translate-x-1/2 -translate-y-1/2 pointer-events-auto",
					{
						"opacity-60": isCore,
						"opacity-30": isGhost,
					},
				)}
				style={{
					backgroundColor: color,
					borderColor: chroma(color).darken().css("rgb"),
				}}
			/>
		);
	}
	if (type === "ping") {
		return <SensorPing color={color} size={size} />;
	}
	return null;
}

function SensorPing({ color, size }: { color: string; size: number }) {
	return (
		<div
			className="sensors-ping h-full w-full rounded-full duration-[3s] transition-all bg-transparent"
			style={{
				// @ts-expect-error
				"--scale": size,
				boxShadow: `inset 0px 0px 100px ${color}`,
			}}
		/>
	);
}

export function GridLines({
	rings = 3,
	lines = 12,
	aligned = false,
}: {
	rings?: number;
	lines?: number;
	aligned?: boolean;
}) {
	return (
		<>
			{Array(rings)
				.fill(0)
				.map((_, i, array) => (
					<div
						key={`ring-${i}`}
						className="z-10 border border-white/20 rounded-full pointer-events-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
						style={{
							width: `${((i + 1) / array.length) * 100}%`,
							height: `${((i + 1) / array.length) * 100}%`,
						}}
					/>
				))}
			{Array(lines)
				.fill(0)
				.map((_, i, array) => (
					<div
						key={`line-${i}`}
						className="z-10 bg-white/10 w-full h-px pointer-events-none absolute top-1/2 -translate-y-1/2"
						style={{
							transform: `rotate(${
								((i + (aligned ? 0 : 0.5)) / array.length) * 360
							}deg)`,
						}}
					/>
				))}
		</>
	);
}

function polarToCartesian(
	centerX: number,
	centerY: number,
	radius: number,
	angleInDegrees: number,
) {
	const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

	return {
		x: centerX + radius * Math.cos(angleInRadians),
		y: centerY + radius * Math.sin(angleInRadians),
	};
}

function describeArc(
	x: number,
	y: number,
	innerRadius: number,
	outerRadius: number,
	startAngle: number,
	endAngle: number,
) {
	const innerStart = polarToCartesian(x, y, innerRadius, endAngle);
	const innerEnd = polarToCartesian(x, y, innerRadius, startAngle);
	const outerStart = polarToCartesian(x, y, outerRadius, endAngle);
	const outerEnd = polarToCartesian(x, y, outerRadius, startAngle);

	const d = [
		"M",
		outerStart.x,
		outerStart.y,
		"A",
		outerRadius,
		outerRadius,
		0,
		0,
		0,
		outerEnd.x,
		outerEnd.y,
		"L",
		innerEnd.x,
		innerEnd.y,
		"A",
		innerRadius,
		innerRadius,
		0,
		0,
		1,
		innerStart.x,
		innerStart.y,
		"L",
		outerStart.x,
		outerStart.y,
	].join(" ");

	return d;
}

export function GridSegments({
	rings = 3,
	lines = 12,
	aligned = false,
}: {
	rings?: number;
	lines?: number;
	aligned?: boolean;
}) {
	const { shipId, station } = useStation();
	const isCore = station.name === "Flight Director";
	const [sensors] = q.legacy.sensorGrid.sensors.useNetRequest({ shipId });
	const segments = sensors.segments;
	return (
		<svg
			viewBox="0 0 100 100"
			className={cn("w-full pointer-events-none", { absolute: !isCore })}
		>
			{Array.from({ length: rings }).map((_, i) =>
				Array.from({ length: lines }).map((_, ii) => (
					<path
						key={`blackout-${i}-${ii}`}
						fill="black"
						onClick={(event) => {
							if (!isCore) return;
							if (event.altKey) {
								q.legacy.sensorGrid.setSegment.netSend({
									shipId,
									ring: i,
									line: ii,
									blocked: !segments[`${i}-${ii}`],
								});
							}
						}}
						className={cn("opacity-0 pointer-events-none", {
							"opacity-100": segments[`${i}-${ii}`],
							"pointer-events-auto": isCore,
						})}
						d={describeArc(
							50,
							50,
							(50 / rings) * i,
							(50 / rings) * (1 + i),
							((ii - (aligned ? 0 : 0.5)) * 360) / lines,
							((ii + 1 - (aligned ? 0 : 0.5)) * 360) / lines,
						)}
					/>
				)),
			)}
		</svg>
	);
}
