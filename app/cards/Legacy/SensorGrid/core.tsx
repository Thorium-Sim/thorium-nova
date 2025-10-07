import { q } from "@thorium/context/AppContext";
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
import {
	Suspense,
	useEffect,
	useRef,
	useState,
	type PointerEvent,
	type ReactNode,
} from "react";
import {
	Header,
	Menu,
	MenuItem,
	MenuTrigger,
	Popover,
	Button as RAButton,
} from "react-aria-components";
import chroma from "chroma-js";
import { capitalCase } from "change-case";
import "./style.css";
import { SensorGrid } from "@thorium/cards/Legacy/SensorGrid/SensorGrid";
import {
	sensorsSpeeds,
	useSensorsStore,
} from "@thorium/cards/Legacy/SensorGrid/useSensorsStore";
import { isArmyContact } from "@thorium/ecs-components/legacySensorContact";

export function LegacySensorGridCore() {
	const [page, setPage] = useState<"Icons" | "Extras" | "Move">("Icons");
	const { shipId } = useStation();
	const sensorsStore = useSensorsStore();

	const [contacts] = q.legacy.sensorGrid.sensorContacts.useNetRequest({
		shipId,
	});
	const [sensors] = q.legacy.sensorGrid.sensors.useNetRequest({ shipId });

	const gridRef = useRef<HTMLDivElement>(null);
	const draggingRef = useRef<HTMLDivElement>(null);

	const [dragging, setDragging] = useState<
		number | "planet" | "border" | "ping" | null
	>(null);

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
					items={sensorsSpeeds}
					label="Speed"
					labelHidden
					selected={sensors.defaultSpeed}
					setSelected={(value) =>
						Array.isArray(value) || !value
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
			<SensorGrid
				gridRef={gridRef}
				draggingRef={draggingRef}
				dragging={dragging}
				className="col-span-2 p-8 bg-[rgb(8,13,19)]"
			/>
		</div>
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
	const [sensors] = q.legacy.sensorGrid.sensors.useNetRequest({ shipId });

	const sensorsStore = useSensorsStore();

	const contact = contacts.find((c) => c.id === editContact);
	if (contact) {
		return (
			<ContactEditor
				close={() => setEditContact(null)}
				{...contact}
				isArmyContact
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
				<div>
					Program
					<div>
						{sensors.program ? (
							<Button
								className="btn-xs btn-error"
								onClick={() =>
									q.legacy.sensorGrid.setProgram.netSend({
										shipId,
										program: null,
									})
								}
							>
								Stop
							</Button>
						) : (
							<MenuTrigger>
								<RAButton className="btn flex btn-xs btn-success">Go</RAButton>
								<Popover>
									<Menu className="text-sm bg-black text-white border border-white/50 rounded py-2">
										<Header className="font-bold px-2">Density</Header>
										<MenuItem
											className="px-2"
											onAction={() =>
												q.legacy.sensorGrid.setProgram.netSend({
													shipId,
													program: { type: "field", density: 0.05 },
												})
											}
										>
											Light
										</MenuItem>
										<MenuItem
											className="px-2"
											onAction={() =>
												q.legacy.sensorGrid.setProgram.netSend({
													shipId,
													program: { type: "field", density: 0.125 },
												})
											}
										>
											Moderate
										</MenuItem>
										<MenuItem
											className="px-2"
											onAction={() =>
												q.legacy.sensorGrid.setProgram.netSend({
													shipId,
													program: { type: "field", density: 0.2 },
												})
											}
										>
											Dense
										</MenuItem>
									</Menu>
								</Popover>
							</MenuTrigger>
						)}
					</div>
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
							types={["images"]}
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
	omitFromProgram,
	isArmyContact,
}: {
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
	omitFromProgram?: boolean;
	isArmyContact?: boolean;
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
			omitFromProgram: boolean;
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
							types={["images"]}
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
							types={["images"]}
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
			{isArmyContact ? (
				<Checkbox
					label="Omit From Programs"
					defaultChecked={omitFromProgram}
					onChange={(event) =>
						update({
							omitFromProgram: event.currentTarget.checked,
						})
					}
				/>
			) : null}
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
			<Suspense fallback={<div className="h-4 w-4" />}>
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
			</Suspense>
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
								value &&
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
						movement: { x: x / 2, y: y / 2 },
					});
				}}
			>
				<div className="bg-white/50 w-full h-px absolute" />
				<div className="bg-white/50 w-px h-full absolute" />
			</Joystick>
			<Button
				className="btn-xs btn-warning"
				onClick={() => ref.current?.reset()}
			>
				Reset
			</Button>
		</div>
	);
}
