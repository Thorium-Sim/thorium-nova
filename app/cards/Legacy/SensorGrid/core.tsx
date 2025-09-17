import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { FilesMenu } from "@thorium/ui/FilesMenu";
import { Icon } from "@thorium/ui/Icon";
import Input from "@thorium/ui/Input";
import { Joystick } from "@thorium/ui/Joystick";
import Select from "@thorium/ui/Select";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import {
	Suspense,
	useEffect,
	useRef,
	useState,
	type DetailedHTMLProps,
	type HTMLAttributes,
	type PointerEvent,
	type ReactNode,
	type RefObject,
} from "react";
import {
	Menu,
	MenuItem,
	Popover,
	Button as RAButton,
	Separator,
} from "react-aria-components";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import maskUrl from "./mask.svg?url";
import { Explosion } from "@thorium/cards/Legacy/SensorGrid/Explosion";
import chroma from "chroma-js";
import { capitalCase } from "change-case";

const useSensorsStore = create(
	persist<{
		askForSpeed: boolean;
		nudgeDistance: number;
		showContactLabels: boolean;
		selectedContact: number | null;
		planet: {
			name: string;
			color: string;
			size: number;
			icon: "";
			picture: string;
		};
		border: { name: string; color: string; size: 1; icon: ""; picture: string };
		ping: {
			name: string;
			color: string;
			size: number;
			icon: "";
			picture: string;
		};
	}>(
		() => ({
			askForSpeed: false,
			nudgeDistance: 5,
			showContactLabels: false,
			selectedContact: null,
			planet: {
				name: "Planet",
				color: "#663399",
				size: 0.75,
				icon: "",
				picture: "",
			},
			border: {
				name: "Border",
				color: "#663399",
				size: 1,
				icon: "",
				picture: "",
			},
			ping: { name: "", color: "#663399", size: 5, icon: "", picture: "" },
		}),
		{
			name: "legacy-sensors-store",
			version: 1,
		},
	),
);

const speeds = [
	{ id: 1000, label: "Instant" },
	{ id: 1, label: "Warp" },
	{ id: 0.3, label: "Very Fast" },
	{ id: 0.1, label: "Fast" },
	{ id: 0.05, label: "Moderate" },
	{ id: 0.025, label: "Slow" },
	{ id: 0.01, label: "Very Slow" },
];

export function LegacySensorGridCore() {
	const [page, setPage] = useState<"Icons" | "Extras" | "Move">("Icons");
	const { shipId } = useStation();
	const sensorsStore = useSensorsStore();

	const [armyContacts] = q.legacy.sensorGrid.armyContacts.useNetRequest({
		shipId,
	});
	const [contacts] = q.legacy.sensorGrid.sensorContacts.useNetRequest({
		shipId,
	});
	const [sensors] = q.legacy.sensorGrid.sensors.useNetRequest({ shipId });
	q.legacy.sensorGrid.stream.useDataStream({ shipId });

	const gridRef = useRef<HTMLDivElement>(null);
	const draggingRef = useRef<HTMLDivElement>(null);

	const [dragging, setDragging] = useState<
		number | "planet" | "border" | "ping" | null
	>(null);

	const draggingContact = !dragging
		? null
		: typeof dragging === "number"
			? armyContacts.find((c) => c.id === dragging)
			: sensorsStore[dragging];

	async function setDraggingContact(
		armyContactId: number | "planet" | "border" | "ping",
		position: [number, number],
		down: boolean,
	) {
		if (!down) {
			// Check if the contact is within the sensor grid area
			const gridParentDimensions =
				gridRef.current?.parentElement?.getBoundingClientRect();
			const draggingDimensions =
				draggingRef.current?.children[0]?.getBoundingClientRect();
			if (!gridParentDimensions || !draggingDimensions) {
				setDragging(null);
				return;
			}

			if (
				draggingDimensions.left < gridParentDimensions.right &&
				draggingDimensions.right > gridParentDimensions.left &&
				draggingDimensions.top < gridParentDimensions.bottom &&
				draggingDimensions.bottom > gridParentDimensions.top
			) {
				const dimensions = gridRef.current?.getBoundingClientRect();
				if (!dimensions) {
					setDragging(null);
					return;
				}
				const x = (position[0] - dimensions.left) / dimensions.width;
				const y = (position[1] - dimensions.top) / dimensions.height;

				if (typeof armyContactId === "number") {
					await q.legacy.sensorGrid.addContact.netSend({
						armyContactId,
						position: [x, y],
					});
				} else {
					await q.legacy.sensorGrid.addSpecialContact.netSend({
						shipId,
						type: armyContactId,
						...useSensorsStore.getState()[armyContactId],
						position: [x, y],
					});
				}
			}

			setDragging(null);
			return;
		}

		if (!dragging) {
			setDragging(armyContactId);
		}

		const dimensions = gridRef.current?.getBoundingClientRect();
		if (!dimensions) return;
		const x = (position[0] - dimensions.left) / dimensions.width;
		const y = (position[1] - dimensions.top) / dimensions.height;
		if (draggingRef.current) {
			draggingRef.current.style.transform = `translate(${x * 100}%, ${y * 100}%) `;
		}
	}

	const selectedContact = contacts.find(
		(c) => c.id === sensorsStore.selectedContact,
	);

	return (
		<div className="grid grid-cols-3 h-full overflow-hidden justify-items-end">
			<div className="w-full flex flex-col max-h-full h-full min-h-0 bg-black z-20">
				<Select
					size="xxs"
					items={speeds}
					label="Speed"
					labelHidden
					selected={sensors.defaultSpeed}
					setSelected={(value) =>
						Array.isArray(value)
							? null
							: q.legacy.sensorGrid.updateSensors.netSend({
									sensorsId: sensors.id,
									defaultSpeed: value,
								})
					}
				/>
				<div className="flex w-full gap-1">
					<Button
						className="flex-1 btn-xs btn-error"
						onClick={() =>
							q.legacy.sensorGrid.clearContacts.netSend({ shipId })
						}
					>
						Clear
					</Button>
					<Button
						className="flex-1 btn-xs btn-warning"
						onClick={() => q.legacy.sensorGrid.stopContacts.netSend({ shipId })}
					>
						Stop
					</Button>
					{sensors.frozen ? (
						<>
							<Button
								className="flex-1 btn-xs btn-info"
								onClick={() =>
									q.legacy.sensorGrid.unfreezeSensors.netSend({
										shipId,
										apply: false,
									})
								}
							>
								Cancel
							</Button>
							<Button
								className="flex-1 btn-xs btn-success"
								onClick={() =>
									q.legacy.sensorGrid.unfreezeSensors.netSend({
										shipId,
										apply: true,
									})
								}
							>
								Apply
							</Button>
						</>
					) : (
						<Button
							className="flex-1 btn-xs btn-info"
							onClick={() =>
								q.legacy.sensorGrid.freezeSensors.netSend({ shipId })
							}
						>
							Freeze
						</Button>
					)}
				</div>
				<div className="flex btn-group">
					<Button
						className={cn("flex-1 btn-xs btn-success", {
							"btn-active": page === "Icons",
						})}
						onClick={() => setPage("Icons")}
					>
						Icons
					</Button>
					<Button
						className={cn("flex-1 btn-xs btn-info", {
							"btn-active": page === "Extras",
						})}
						onClick={() => setPage("Extras")}
					>
						Extras
					</Button>
					<Button
						className={cn("flex-1 btn-xs btn-primary", {
							"btn-active": page === "Move",
						})}
						onClick={() => setPage("Move")}
					>
						Move
					</Button>
				</div>
				{selectedContact ? (
					<ContactEditor
						close={() => useSensorsStore.setState({ selectedContact: null })}
						{...selectedContact}
						{...selectedContact.frozenState}
						update={(params) =>
							q.legacy.sensorGrid.updateContact.netSend({
								contactId: selectedContact.id,
								...params,
							})
						}
					>
						<Button
							className="btn-xs btn-notice flex-1"
							onClick={() => {
								useSensorsStore.setState({ selectedContact: null });
								q.legacy.sensorGrid.updateContact.netSend({
									contactId: selectedContact.id,
									destroyed: true,
								});
							}}
						>
							Destroy
						</Button>
						<Button
							className="btn-xs btn-error flex-1"
							onClick={() => {
								useSensorsStore.setState({ selectedContact: null });
								q.legacy.sensorGrid.removeContact.netSend({
									contactId: selectedContact.id,
								});
							}}
						>
							Remove
						</Button>
					</ContactEditor>
				) : page === "Icons" ? (
					<IconsPage setDraggingContact={setDraggingContact} />
				) : page === "Extras" ? (
					<ExtrasPage />
				) : page === "Move" ? (
					<MovePage />
				) : null}
			</div>
			<div
				className="col-span-2 aspect-square max-h-full max-w-full p-8 bg-gray-950 rounded-full"
				onClick={() => useSensorsStore.setState({ selectedContact: null })}
			>
				<div
					className="aspect-square relative max-h-full max-w-full"
					ref={gridRef}
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
					<div className="absolute flex items-center justify-center w-full h-full z-0">
						<SensorContacts gridRef={gridRef} />
					</div>
					<GridLines />

					<Interference interference={sensors.interference} />
				</div>
			</div>
		</div>
	);
}

function Interference({ interference }: { interference: number }) {
	const { cardLoaded } = useCardContext();
	const { station } = useStation();
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
			className={cn("absolute w-full h-full bg-white rounded-full", {
				"pointer-events-none":
					interference < 0.5 || station.name === "Flight Director",
			})}
			style={{
				opacity: interference * (station.name === "Flight Director" ? 0.5 : 1),
			}}
		/>
	);
}

function SensorContacts({
	gridRef,
}: { gridRef: RefObject<HTMLDivElement | null> }) {
	const { shipId } = useStation();

	const [contacts] = q.legacy.sensorGrid.sensorContacts.useNetRequest({
		shipId,
	});
	const [destinations] =
		q.legacy.sensorGrid.sensorContactsDestination.useNetRequest({
			shipId,
		});

	const destinationMap = new Map(destinations);
	return contacts.map((c) => (
		<SensorContact
			key={c.id}
			{...c}
			destination={destinationMap.get(c.id) || c.destination}
			gridRef={gridRef}
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

		console.log(Date.now(), frozenState, destination, draggingRef.current);
		if (iconRef.current && !draggingRef.current) {
			iconRef.current.style.transform = `translate(${(frozenState?.destination?.x ?? destination.x) * 100}%, ${(frozenState?.destination?.y ?? destination.y) * 100}%)`;
		}
		if (!position || !contactRef.current) return;
		contactRef.current.style.transform = `translate(${position.x * 100}%, ${position.y * 100}%)`;
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
					className="absolute w-full h-full pointer-events-none select-none"
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
						<ContactImage size={size} isCore {...props} />
					)}
				</div>
			)}
			{isCore && !destroyed ? (
				<div
					className="absolute w-full h-full pointer-events-none select-none"
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
							{speeds.map((speed) => (
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

function ContactImage({
	type,
	icon,
	color,
	disabled,
	size,
	hostile,
	ref,
	isCore,
	...props
}: {
	type: "contact" | "border" | "ping" | "planet" | "projectile";
	icon: string;
	color: string;
	size: number;
	hostile?: boolean;
	disabled?: boolean;
	ref?: RefObject<HTMLDivElement | null>;
	isCore?: boolean;
	dimmed?: boolean;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
	if (type === "contact") {
		return (
			<SVGImageLoader
				url={icon}
				ref={ref}
				{...props}
				onLoad={() => {}}
				className={cn(
					"w-[5%] h-[5%] object-contain cursor-pointer pointer-events-auto",
					{
						"opacity-50": isCore,
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
		);
	}
	if (type === "planet") {
		return (
			<div
				ref={ref}
				{...props}
				className={cn(
					"w-[5%] h-[5%] bg-white border border-gray-300 rounded-full pointer-events-auto opacity-60",
					{
						"opacity-30": isCore,
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
					"h-[3%] w-[150%] bg-white border-4 border-gray-300 -translate-x-1/2 -translate-y-1/2 pointer-events-auto opacity-60",
					{
						"opacity-30": isCore,
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

function IconsPage({
	setDraggingContact,
}: {
	setDraggingContact: (
		armyContactId: number | "planet" | "border" | "ping",
		position: [number, number],
		down: boolean,
	) => void;
}) {
	const [editContact, setEditContact] = useState<
		number | "planet" | "border" | "ping" | null
	>(null);

	const { shipId } = useStation();
	const [contacts] = q.legacy.sensorGrid.armyContacts.useNetRequest({ shipId });
	const sensorsStore = useSensorsStore();

	const contact = contacts.find((c) => c.id === editContact);
	if (contact) {
		return (
			<ContactEditor
				close={() => setEditContact(null)}
				{...contact}
				update={(params) =>
					q.legacy.sensorGrid.updateArmyContact.netSend({
						contactId: contact.id,
						...params,
					})
				}
			>
				<Button
					className="btn-xs btn-error flex-1"
					onClick={() =>
						q.legacy.sensorGrid.removeArmyContact.netSend({
							armyContactId: contact.id,
						})
					}
				>
					Delete
				</Button>
			</ContactEditor>
		);
	}
	if (typeof editContact === "string") {
		return (
			<SpecialEditor close={() => setEditContact(null)} type={editContact} />
		);
	}
	return (
		<div className="h-full flex flex-col">
			<div className="flex-1 text-xs flex flex-col gap-1 px-2">
				{contacts.map((c) => (
					<ArmyContact
						key={c.id}
						{...c}
						onSelect={() => setEditContact(c.id)}
						setDraggingContact={setDraggingContact}
					/>
				))}
			</div>
			<Button
				className="btn-xs btn-success"
				onClick={() => {
					q.legacy.sensorGrid.addArmyContact.netSend({ shipId });
				}}
			>
				Add Contact
			</Button>
			<div className="flex justify-around gap-2 text-xs select-none">
				<div>
					Planet
					<div
						className="w-5 h-5 bg-white border-2 border-gray-400 rounded-full cursor-pointer"
						onPointerDown={handleArmyDrag(
							(pos, down) => setDraggingContact("planet", pos, down),
							() => setEditContact("planet"),
						)}
						style={{
							backgroundColor: sensorsStore.planet.color,
							borderColor: chroma(sensorsStore.planet.color)
								.darken()
								.css("rgb"),
						}}
					/>
				</div>
				<div>
					Border
					<div
						className="w-8 h-3 mt-1 bg-white border-2 border-gray-400 cursor-pointer"
						style={{
							backgroundColor: sensorsStore.border.color,
							borderColor: chroma(sensorsStore.border.color)
								.darken()
								.css("rgb"),
						}}
						onPointerDown={handleArmyDrag(
							(pos, down) => setDraggingContact("border", pos, down),
							() => setEditContact("border"),
						)}
					/>
				</div>
				<div>
					Ping
					<div
						className="w-5 h-5 bg-white/20 border-2 border-gray-400 rounded-full cursor-pointer shadow-[inset_0_0_6px_rgba(255,255,255,1)]"
						style={{
							borderColor: chroma(sensorsStore.ping.color).darken().css("rgb"),
							backgroundColor: chroma(sensorsStore.ping.color)
								.alpha(0.2)
								.css("rgb"),
							boxShadow: `inset 0 0 6px ${sensorsStore.ping.color}`,
						}}
						onPointerDown={handleArmyDrag(
							(pos, down) => setDraggingContact("ping", pos, down),
							() => setEditContact("ping"),
						)}
					/>
				</div>
			</div>
		</div>
	);
}

function SpecialEditor({
	close,
	type,
}: { type: "planet" | "border" | "ping"; close: () => void }) {
	const sensorStore = useSensorsStore();
	const contact = sensorStore[type];

	return (
		<div className="text-xs flex flex-col overflow-y-auto h-full">
			<p>Edit {capitalCase(type)}</p>
			{type !== "ping" ? (
				<>
					<Input
						label="Contact Label"
						className="input-xs"
						labelProps={{ className: "text-xs" }}
						defaultValue={contact.name}
						onBlur={(event) =>
							useSensorsStore.setState((store) => ({
								[type]: { ...store[type], name: event.currentTarget.value },
							}))
						}
					/>
					<div>
						<p>Picture</p>
						<FilesMenu
							root="Sensor Contacts"
							types="images"
							canUpload
							setValue={(value) =>
								useSensorsStore.setState((store) => ({
									[type]: { ...store[type], picture: value },
								}))
							}
						>
							<RAButton className="w-full max-w-32 aspect-square border-2 border-white/30 rounded bg-gray-900 p-2">
								<Suspense>
									<SVGImageLoader
										className="w-full h-full  object-contain"
										url={contact.picture}
									/>
								</Suspense>
							</RAButton>
						</FilesMenu>
					</div>
				</>
			) : null}
			<label>
				<p>Color</p>
				<input
					type="color"
					className="w-12"
					defaultValue={contact.color}
					onChange={(event) =>
						useSensorsStore.setState((store) => ({
							[type]: { ...store[type], color: event.target.value },
						}))
					}
				/>
			</label>
			{type !== "border" ? (
				<label>
					<p className="tabular-nums">
						Size ({Math.round(contact.size * 100)}% of grid diameter)
					</p>
					<input
						type="range"
						defaultValue={contact.size}
						onChange={(event) =>
							useSensorsStore.setState((store) => ({
								[type]: { ...store[type], size: Number(event.target.value) },
							}))
						}
						min={0.1}
						step={0.1}
						max={2}
					/>
				</label>
			) : null}
			<div className="flex-1" />

			<Button className="btn-xs btn-success" onClick={() => close()}>
				Close
			</Button>
		</div>
	);
}
function ContactEditor({
	close,
	id,
	name,
	icon,
	picture,
	color,
	size,
	locked,
	disabled,
	hostile,
	cloaked,
	infrared,
	update,
	children,
}: {
	id: number;
	name: string;
	icon: string;
	picture: string | null;
	color: string;
	size: number;
	locked: boolean;
	disabled: boolean;
	hostile: boolean;
	cloaked: boolean;
	infrared: boolean;
	close: () => void;
	update: (
		props: Partial<{
			name: string;
			icon: string;
			picture: string;
			size: number;
			color: string;
			locked: boolean;
			disabled: boolean;
			hostile: boolean;
			cloaked: boolean;
			infrared: boolean;
		}>,
	) => void;
	children?: ReactNode;
}) {
	const [optimisticColor, setOptimisticColor] = useState(color);
	const [optimisticSize, setOptimisticSize] = useState(size);

	useEffect(() => {
		setOptimisticColor(color);
	}, [color]);
	return (
		<div className="text-xs flex flex-col overflow-y-auto h-full">
			<Input
				label="Contact Label"
				className="input-xs"
				labelProps={{ className: "text-xs" }}
				defaultValue={name}
				onBlur={(event) => update({ name: event.currentTarget.value })}
			/>
			<div className="flex gap-4">
				<div className="flex-1">
					<p>Icon</p>
					<Suspense>
						<FilesMenu
							root="Sensor Contacts"
							types="images"
							canUpload
							setValue={(value) =>
								update({
									icon: value,
								})
							}
						>
							<RAButton className="w-full max-w-32 aspect-square border-2 border-white/30 rounded bg-gray-900 p-2">
								<SVGImageLoader
									className="w-full h-full object-contain"
									style={{ color: optimisticColor }}
									url={icon}
								/>
							</RAButton>
						</FilesMenu>
					</Suspense>
				</div>
				<div className="flex-1">
					<p>Picture</p>
					<Suspense>
						<FilesMenu
							root="Sensor Contacts"
							types="images"
							canUpload
							setValue={(value) =>
								update({
									picture: value,
								})
							}
						>
							<RAButton className="w-full max-w-32 aspect-square border-2 border-white/30 rounded bg-gray-900 p-2">
								<SVGImageLoader
									className="w-full h-full  object-contain"
									url={picture || ""}
								/>
							</RAButton>
						</FilesMenu>
					</Suspense>
				</div>
			</div>
			{icon.endsWith(".svg") ? (
				<label>
					<p>Color</p>
					<input
						type="color"
						className="w-12"
						defaultValue={color}
						onChange={(event) => {
							setOptimisticColor(event.currentTarget.value);
							update({
								color: event.currentTarget.value,
							});
						}}
					/>
				</label>
			) : null}
			<label>
				<p className="tabular-nums">Size ({optimisticSize})</p>
				<input
					type="range"
					defaultValue={size}
					onChange={(event) => {
						setOptimisticSize(Number(event.currentTarget.value));
						update({
							size: Number(event.currentTarget.value),
						});
					}}
					min={0.2}
					step={0.1}
					max={20}
				/>
			</label>
			<Checkbox
				label="Locked"
				defaultChecked={locked}
				onChange={(event) =>
					update({
						locked: event.currentTarget.checked,
					})
				}
			/>
			<Checkbox
				label="Disabled"
				defaultChecked={disabled}
				onChange={(event) =>
					update({
						disabled: event.currentTarget.checked,
					})
				}
			/>
			<Checkbox
				label="Hostile"
				defaultChecked={hostile}
				onChange={(event) =>
					update({
						hostile: event.currentTarget.checked,
					})
				}
			/>
			<Checkbox
				label="Cloaked"
				defaultChecked={cloaked}
				onChange={(event) =>
					update({
						cloaked: event.currentTarget.checked,
					})
				}
			/>
			<Checkbox
				label="Infrared"
				defaultChecked={infrared}
				onChange={(event) =>
					update({
						infrared: event.currentTarget.checked,
					})
				}
			/>
			<div className="flex-1" />
			<div className="flex gap-2">
				{children}

				<Button className="btn-xs btn-success flex-1" onClick={() => close()}>
					Close
				</Button>
			</div>
		</div>
	);
}

function handleArmyDrag(
	setDraggingContact: (pos: [number, number], down: boolean) => void,
	onSelect: () => void,
) {
	return (event: PointerEvent) => {
		event.stopPropagation();

		const offset = [event.clientX, event.clientY];

		const abortController = new AbortController();

		document.addEventListener(
			"pointermove",
			(event) => {
				if (
					Math.hypot(offset[0] - event.clientX, offset[1] - event.clientY) >= 5
				) {
					setDraggingContact([event.clientX, event.clientY], true);
				}
			},
			{ signal: abortController.signal },
		);
		document.addEventListener(
			"pointerup",
			(event) => {
				setDraggingContact([event.clientX, event.clientY], false);

				if (
					Math.hypot(offset[0] - event.clientX, offset[1] - event.clientY) < 5
				) {
					onSelect();
				}
				abortController.abort();
			},
			{ once: true },
		);
	};
}
function ArmyContact({
	id,
	name,
	icon,
	color,
	onSelect,
	setDraggingContact,
}: {
	id: number;
	name: string;
	icon: string;
	color: string;
	onSelect: () => void;
	setDraggingContact: (
		armyContactId: number,
		position: [number, number],
		down: boolean,
	) => void;
}) {
	return (
		<div key={id} className="flex gap-2" onPointerDown={onSelect}>
			<SVGImageLoader
				url={icon}
				className="h-4 aspect-square cursor-pointer object-contain"
				style={{ color }}
				onPointerDown={handleArmyDrag(
					(pos, down) => setDraggingContact(id, pos, down),
					onSelect,
				)}
				onLoad={() => {}}
			/>
			<span className="select-none">{name}</span>
		</div>
	);
}

function ExtrasPage() {
	const { shipId } = useStation();
	const [sensors] = q.legacy.sensorGrid.sensors.useNetRequest({ shipId });

	const store = useSensorsStore();

	function nudge({
		x = 0,
		y = 0,
		yaw = 0,
	}: { x?: number; y?: number; yaw?: number }) {
		q.legacy.sensorGrid.nudge.netSend({
			shipId,
			nudge: {
				x: x * store.nudgeDistance,
				y: y * store.nudgeDistance,
				yaw: yaw * store.nudgeDistance,
			},
		});
	}
	return (
		<div className="overflow-y-auto flex-1">
			<div className="flex justify-between">
				<div className="flex-1">
					<Select
						size="xxs"
						items={[100, 90, 75, 60, 50, 45, 30, 20, 15, 10, 7, 5, 3, 2, 1].map(
							(i) => ({ id: i, label: `${i}` }),
						)}
						label="Nudge Distance"
						labelProps={{ className: "text-xs" }}
						selected={store.nudgeDistance}
						setSelected={(value) => {
							!Array.isArray(value) &&
								useSensorsStore.setState({ nudgeDistance: value });
						}}
					/>
				</div>
				<div className="grid grid-cols-3 justify-items-end">
					<button onClick={() => nudge({ yaw: -1 })}>
						<Icon name="rotate-ccw" />
					</button>
					<button onClick={() => nudge({ y: -1 })}>
						<Icon name="arrow-up" />
					</button>
					<button onClick={() => nudge({ yaw: 1 })}>
						<Icon name="rotate-cw" />
					</button>
					<button onClick={() => nudge({ x: -1 })}>
						<Icon name="arrow-left" />
					</button>
					<button onClick={() => nudge({ y: 1 })}>
						<Icon name="arrow-down" />
					</button>
					<button onClick={() => nudge({ x: 1 })}>
						<Icon name="arrow-right" />
					</button>
				</div>
			</div>
			<div className="text-xs">
				<Checkbox
					label="Ask for speed"
					checked={store.askForSpeed}
					onChange={(event) =>
						useSensorsStore.setState({
							askForSpeed: event.currentTarget.checked,
						})
					}
				/>
				<Checkbox
					label="Add to targeting"
					checked={sensors.autoTargeting}
					onChange={(event) =>
						q.legacy.sensorGrid.updateSensors.netSend({
							sensorsId: sensors.id,
							autoTargeting: event.currentTarget.checked,
						})
					}
				/>
				<Checkbox
					label="Use sonar ping"
					checked={sensors.pingActive}
					onChange={(event) =>
						q.legacy.sensorGrid.updateSensors.netSend({
							sensorsId: sensors.id,
							pingActive: event.currentTarget.checked,
						})
					}
				/>
				<Checkbox
					label="Show contact labels"
					checked={store.showContactLabels}
					onChange={(event) =>
						useSensorsStore.setState({
							showContactLabels: event.currentTarget.checked,
						})
					}
				/>
				<Checkbox
					label="Auto-thrusters"
					checked={sensors.autoThrusters}
					onChange={(event) =>
						q.legacy.sensorGrid.updateSensors.netSend({
							sensorsId: sensors.id,
							autoThrusters: event.currentTarget.checked,
						})
					}
				/>
				<label>
					Interference
					<input
						type="range"
						min={0}
						max={1}
						step={0.01}
						defaultValue={sensors.interference}
						onChange={(event) =>
							q.legacy.sensorGrid.updateSensors.netSend({
								sensorsId: sensors.id,
								interference: Number(event.currentTarget.value),
							})
						}
					/>
				</label>
				<p>Option-click grid segments to black out</p>
			</div>
		</div>
	);
}

function MovePage() {
	const { shipId } = useStation();
	const ref = useRef<{
		reset: () => void;
		set: (x: number, y: number) => void;
	}>(null);
	const downRef = useRef(false);
	const [sensors] = q.legacy.sensorGrid.sensors.useNetRequest(
		{ shipId },
		{
			callback(data) {
				if (!downRef.current) {
					ref.current?.set(data.movement.x, data.movement.y);
				}
			},
		},
	);
	return (
		<div className="p-2">
			<Joystick
				id="move"
				sticky
				ref={ref}
				onDrag={({ x, y }, down) => {
					downRef.current = down;
					q.legacy.sensorGrid.updateSensors.netSend({
						sensorsId: sensors.id,
						movement: { x, y },
					});
				}}
			/>
			<Button
				className="btn-xs btn-warning"
				onClick={() => ref.current?.reset()}
			>
				Reset
			</Button>
		</div>
	);
}

function GridLines({
	rings = 3,
	lines = 12,
	aligned = false,
}: { rings?: number; lines?: number; aligned?: boolean }) {
	return (
		<>
			{Array(rings)
				.fill(0)
				.map((_, i, array) => (
					<div
						key={`ring-${i}`}
						className="border border-white/20 rounded-full pointer-events-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
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
						className="bg-white/10 w-full h-px pointer-events-none absolute top-1/2 -translate-y-1/2"
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
