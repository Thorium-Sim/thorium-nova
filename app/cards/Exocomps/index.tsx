import type { CardProps } from "@thorium/cards/CardProps";
import { CargoContainerDot } from "@thorium/cards/CargoControl/CargoContainerDot";
import { CargoList } from "@thorium/cards/CargoControl/CargoList";
import { DeckPicker } from "@thorium/cards/CargoControl/DeckPicker";
import { RoomDot, RoomDotLabel } from "@thorium/cards/CargoControl/RoomDot";
import { ShipView } from "@thorium/cards/CargoControl/ShipView";
import { useShipMapStore } from "@thorium/cards/CargoControl/useShipMapStore";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import {
	damageControlInstruction,
	type DamageControlInstructions,
} from "@thorium/ecs-components/damageControl";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";

import "./style.css";
import { Icon } from "@thorium/ui/Icon";
import { RoomSelector } from "@thorium/ui/RoomSelector";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { capitalCase } from "change-case";
import { fromDate } from "dot-beat-time";
import { produce } from "immer";
import {
	useEffect,
	useRef,
	useState,
	type Dispatch,
	type RefObject,
	type SetStateAction,
} from "react";
import { createPortal } from "react-dom";

type InstructionsList = ({ type: DamageControlInstructions; config: Record<string, any> } | null)[];

export function Exocomps(props: CardProps) {
	const { shipId } = useStation();
	const deckIndex = useShipMapStore((state) => state.deckIndex);
	const selectedContainerId = useShipMapStore((state) => state.selectedContainerId);

	const [systemRooms] = q.exocomps.rooms.useNetRequest({ shipId });

	// Preload these queries with the card
	q.cargoControl.inventoryTypes.useNetRequest();
	q.exocomps.inventory.useNetRequest({ shipId });
	q.ship.rooms.useNetRequest({ shipId });

	const { decks } = systemRooms;
	q.exocomps.stream.useDataStream({ shipId });

	const maxDeckName = Math.max(...decks.map((d) => d.name.length));

	return (
		<div
			className="relative mx-auto grid h-full grid-rows-2 gap-8"
			style={{
				gridTemplateColumns: `calc(${maxDeckName}ch + 1.25rem) 1fr 30% 50px`,
			}}
		>
			<DeckPicker decks={decks} />
			<div className="row-span-2">
				<ShipView
					deckIndex={deckIndex}
					cardLoaded={props.cardLoaded}
					deckChildren={(deck, deckIndex, ref) => (
						<>
							<SystemRooms deck={deck} deckIndex={deckIndex} svgRef={ref} />
						</>
					)}
				></ShipView>
			</div>
			<div className="@container row-span-2 flex flex-col gap-2">
				{typeof selectedContainerId === "number" && <Instructions key={selectedContainerId} />}
			</div>
			<ExocompsList />
		</div>
	);
}

function SystemRooms({
	deck,
	deckIndex,
	svgRef,
}: {
	deck: { name: string };
	deckIndex: number;
	svgRef: RefObject<HTMLDivElement | null>;
}) {
	const { shipId } = useStation();

	const [systemRooms] = q.exocomps.rooms.useNetRequest({ shipId });
	const { rooms } = systemRooms;
	const [exocomps] = q.exocomps.exocomps.useNetRequest({ shipId });

	const [renderSite, setRenderSite] = useState<SVGElement | null>(null);
	useEffect(() => {
		if (!renderSite) {
			if (svgRef.current?.children[0]) {
				setRenderSite(svgRef.current.children[0] as SVGElement);
			}
		}
	}, [renderSite, svgRef]);
	const [currentTooltip, setCurrentTooltip] = useState<number | null>(null);
	if (!renderSite) return null;

	return createPortal(
		<>
			{rooms.map((room) =>
				room.deck === deck.name ? (
					<RoomDot
						key={room.id}
						id={room.id}
						name={room.name || ""}
						position={{
							x: room.position.x * 1.086,
							y: room.position.y * 1.086,
						}}
						onPointerEnter={() => setCurrentTooltip(room.id)}
						onPointerLeave={() => setCurrentTooltip(null)}
					/>
				) : null,
			)}
			{rooms.map((room) =>
				room.deck === deck.name ? (
					<RoomDotLabel
						key={room.id}
						name={room.name || ""}
						position={{
							x: room.position.x * 1.086,
							y: room.position.y * 1.086,
						}}
						tooltipShown={currentTooltip === room.id}
					/>
				) : null,
			)}
			{exocomps.map(
				(container) =>
					container.position && (
						<CargoContainerDot
							key={container.id}
							id={container.id}
							position={container.position}
							deckIndex={deckIndex}
						/>
					),
			)}
		</>,
		renderSite,
		deck.name,
	);
}

function ExocompsList() {
	const { shipId } = useStation();

	const [exocomps] = q.exocomps.exocomps.useNetRequest({ shipId });
	return (
		<div className="row-span-2 flex h-full flex-col justify-center gap-4">
			{exocomps.map((exocomp) => (
				<Exocomp key={exocomp.id} exocomp={exocomp} />
			))}
		</div>
	);
}

function Exocomp({
	exocomp,
}: {
	exocomp: { id: number; maxCharge: number; currentCharge: number };
}) {
	const { cardLoaded } = useCardContext();
	const selectedContainerId = useShipMapStore((state) => state.selectedContainerId);
	const isSelected = exocomp.id === selectedContainerId;
	const { interpolate } = useLiveQuery();

	const powerPercent = (exocomp.currentCharge / exocomp.maxCharge) * 100;
	const powerRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	useAnimationFrame(() => {
		const data = interpolate(exocomp.id);
		if (powerRef.current && data && tooltipRef.current) {
			const powerPercent = (data.f / exocomp.maxCharge) * 100;
			powerRef.current.style.background = `conic-gradient(var(--color-yellow-400), var(--color-yellow-400) ${powerPercent}%, transparent ${powerPercent}%)`;
			tooltipRef.current.innerText = `${powerPercent.toFixed(0)}% Charged`;
		}
	}, cardLoaded);
	return (
		<div className="relative">
			<Tooltip content="100% Charged" ref={tooltipRef}>
				<button
					className={`relative z-10 flex aspect-square w-full cursor-pointer items-center justify-center rounded-full border border-white text-3xl transition-colors ${
						isSelected ? "bg-primary-focus/75 hover:bg-primary-focus" : "bg-black hover:bg-gray-900"
					}`}
					onClick={() => {
						const exocompPosition = interpolate(exocomp.id);
						if (!exocompPosition) return;
						useShipMapStore.setState({
							deckIndex: Math.round(exocompPosition.z || 0),
						});
						useShipMapStore.setState({ selectedContainerId: exocomp.id });
					}}
				>
					<Icon name="exocomp" />
				</button>
			</Tooltip>
			<div
				ref={powerRef}
				className="pointer-events-none absolute -top-0.5 -left-0.5 z-0 aspect-square w-[calc(100%+0.25rem)] rounded-full"
				style={{
					background: `conic-gradient(var(--color-yellow-400), var(--color-yellow-400) ${powerPercent}%, transparent ${powerPercent}%)`,
				}}
			/>
		</div>
	);
}
const instructionItems = damageControlInstruction._def.options.flatMap((u) =>
	u._def.options.map((i) => {
		const { type: typeShape, ...rest } = i._def.shape();
		const type = typeShape._def.value;
		const keys = Object.keys(rest);
		return {
			id: type,
			label: capitalCase(type),
			config: keys,
		};
	}),
);

const EXOCOMP_INSTRUCTION_COUNT = 5;
function Instructions() {
	const { shipId } = useStation();

	const [exocompInstructions, setExocompInstructions] = useState<InstructionsList>(
		Array.from({ length: EXOCOMP_INSTRUCTION_COUNT }).map(() => null),
	);
	const [instructionIndex, setInstructionIndex] = useState<number | null>(null);
	const [selectedItem, setSelectedItem] = useState<(typeof instructionItems)[number] | null>(null);
	const [config, setConfig] = useState<Record<string, any>>({});

	const [exocomps] = q.exocomps.exocomps.useNetRequest({ shipId });
	const selectedContainerId = useShipMapStore((state) => state.selectedContainerId);
	const selectedExocomp = exocomps.find((e) => e.id === selectedContainerId);

	const exocompHasInstructions =
		selectedExocomp &&
		selectedExocomp.instructions.length > 0 &&
		selectedExocomp.instructionIndex !== -1 &&
		selectedExocomp.instructionIndex < selectedExocomp.instructions.length;
	async function deployExocomp() {
		if (typeof selectedContainerId !== "number") return;
		await q.exocomps.assign.netSend({
			exocompId: selectedContainerId,
			instructions: damageControlInstruction
				.array()
				.parse(exocompInstructions.flatMap((i) => (i ? { type: i.type, ...i.config } : []))),
		});
	}

	return (
		<>
			<div>
				<p>Instructions</p>
				<div
					className="grid grid-cols-5 gap-4"
					style={{
						anchorName: "--instructions-grid",
					}}
				>
					{(exocompHasInstructions
						? Array.from({ length: EXOCOMP_INSTRUCTION_COUNT }).map(
								(_, i) => selectedExocomp.instructions[i] || null,
							)
						: exocompInstructions
					).map((instruction, i) => (
						<InstructionButton
							key={i}
							instruction={instruction}
							i={i}
							exocompHasInstructions={exocompHasInstructions}
							instructionIndex={instructionIndex}
							selectedExocomp={selectedExocomp}
							setConfig={setConfig}
							setInstructionIndex={setInstructionIndex}
							setSelectedItem={setSelectedItem}
						/>
					))}
				</div>
			</div>
			{exocompInstructions.filter(Boolean).length > 0 &&
			selectedExocomp &&
			(selectedExocomp.instructionIndex === -1 ||
				selectedExocomp.instructionIndex >= selectedExocomp.instructions.length) ? (
				<Button className="btn-success w-full" onClick={deployExocomp}>
					Deploy
				</Button>
			) : selectedExocomp && selectedExocomp.instructions.length > 0 ? (
				<Button
					className="btn-error w-full"
					onClick={() =>
						selectedContainerId && q.exocomps.cancel.netSend({ exocompId: selectedContainerId })
					}
				>
					Cancel Orders
				</Button>
			) : null}

			{instructionIndex !== null ? (
				<>
					<div
						className={cn("panel min-h-0 h-min gap-4 p-4", {
							"grid grid-cols-[4rem_auto] @sm:grid-cols-[repeat(2,4rem_auto)] @lg:grid-cols-[repeat(3,4rem_auto)] place-items-center ":
								!selectedItem,
							"flex min-h-0 w-full flex-col gap-4": selectedItem,
							"overflow-y-auto": selectedItem?.id !== "retrieveCargo",
							"overflow-y-visible": selectedItem?.id === "retrieveCargo",
						})}
					>
						{selectedItem ? (
							<>
								<p className="mb-0 text-lg">{selectedItem.label}</p>
								{selectedItem.config.map((key) => {
									switch (key) {
										case "duration":
											return (
												<div key={key}>
													<label className="tabular-nums">
														Duration ({config.duration || 10} sec)
													</label>
													<input
														type="range"
														className="range w-full"
														min={10}
														max={60}
														value={config.duration || 10}
														onChange={(e) => {
															const duration = Number(e.target.value);
															setConfig((config) => ({
																...config,
																duration,
															}));
														}}
													/>
												</div>
											);
										case "cargo":
											return (
												<Parts
													parts={config.cargo || []}
													setParts={(parts) =>
														setConfig((config) => ({
															...config,
															cargo:
																typeof parts === "function" ? parts(config.cargo || []) : parts,
														}))
													}
												/>
											);
										case "roomId":
											return (
												<RoomSelector
													roomId={config.roomId}
													setRoomId={(roomId) => setConfig((config) => ({ ...config, roomId }))}
												/>
											);
										default:
											return null;
									}
								})}
							</>
						) : (
							instructionItems
								.filter(({ id }) => id !== "idle")
								.map((e) => (
									<div key={e.id} className="contents">
										<button
											className="aspect-square w-16 cursor-pointer border border-white p-2 hover:bg-white/10 focus:border-white/80 focus:bg-white/20 active:bg-white/30"
											onClick={() => {
												if (e.config.length === 0) {
													setExocompInstructions(
														produce((draft) => {
															if (typeof instructionIndex === "number") {
																draft[instructionIndex] = { type: e.id, config: {} };
															}
														}),
													);
													setInstructionIndex(null);
													setConfig({});
												} else {
													setSelectedItem(e);
												}
											}}
										>
											<Icon name={e.id} className="h-full w-full" />
										</button>
										<p className="w-full text-sm leading-tight text-balance">{e.label}</p>
									</div>
								))
						)}
					</div>
					<div className="flex gap-2">
						<Button
							className="btn-error flex-auto"
							onClick={() => {
								setExocompInstructions(
									produce((draft) => {
										if (typeof instructionIndex === "number") {
											draft[instructionIndex] = null;
										}
									}),
								);
								setInstructionIndex(null);
								setSelectedItem(null);
								setConfig({});
							}}
						>
							Clear Instruction
						</Button>
						<Button
							className={cn("btn-success flex-auto", { hidden: !selectedItem })}
							onClick={() => {
								setExocompInstructions(
									produce((draft) => {
										if (typeof instructionIndex === "number" && selectedItem) {
											draft[instructionIndex] = { type: selectedItem.id, config };
										}
									}),
								);
								setInstructionIndex(null);
								setSelectedItem(null);
								setConfig({});
							}}
						>
							Set Instruction
						</Button>
					</div>
				</>
			) : null}
			{instructionIndex === null ? <Logs /> : null}
		</>
	);
}

function InstructionButton({
	instruction,
	i,
	instructionIndex,
	exocompHasInstructions,
	selectedExocomp,
	setInstructionIndex,
	setSelectedItem,
	setConfig,
}: {
	instruction: { type: DamageControlInstructions } | null;
	i: number;
	instructionIndex: number | null;
	exocompHasInstructions: boolean | undefined;
	selectedExocomp: { id: number; instructionIndex: number } | undefined;
	setInstructionIndex: (index: number) => void;
	setSelectedItem: (item: (typeof instructionItems)[0] | null) => void;
	setConfig: (config: any) => void;
}) {
	const { interpolate } = useLiveQuery();
	const { cardLoaded } = useCardContext();
	const buttonRef = useRef<HTMLButtonElement>(null);
	useAnimationFrame(() => {
		if (!buttonRef.current) return;
		if (selectedExocomp?.instructionIndex !== i) {
			buttonRef.current.style.background = "";
		} else {
			if (!selectedExocomp) return;
			const exocompEntity = interpolate(selectedExocomp.id);
			if (!exocompEntity) {
				buttonRef.current.style.background = "";
				return;
			}
			const progress = exocompEntity.c * 100;
			buttonRef.current.style.background = `conic-gradient(color-mix(in oklab, var(--color-white) 60%, transparent 90%), color-mix(in oklab, var(--color-white) 30%, transparent 100%) ${progress}%, transparent ${progress}%)`;
		}
	}, cardLoaded);
	return (
		<button
			className={cn("aspect-square border border-white p-2 ", {
				"bg-alert-color/30 hover:bg-alert-color/40 active:bg-alert-color/50":
					i === instructionIndex,
				"hover:bg-white/10 focus:border-white/80 active:bg-white/30": !exocompHasInstructions,
				"border-warning inset-ring-warning inset-ring-2": selectedExocomp?.instructionIndex === i,
			})}
			key={i}
			disabled={exocompHasInstructions}
			onClick={() => {
				if (!instruction || "config" in instruction) {
					setInstructionIndex(i);
					setSelectedItem(instructionItems.find((i) => i.id === instruction?.type) || null);
					setConfig(instruction?.config || {});
				}
			}}
			ref={buttonRef}
		>
			{instruction ? <Icon name={instruction.type} className="h-full w-full" /> : null}
		</button>
	);
}

function Parts({
	parts,
	setParts,
}: {
	parts: { name: string; count: number }[];
	setParts: Dispatch<SetStateAction<{ name: string; count: number }[]>>;
}) {
	const { shipId } = useStation();
	const [exocompParts] = q.exocomps.inventory.useNetRequest({ shipId });
	return (
		<>
			<div className="faded-scroll-y grid min-h-0 flex-1 grid-cols-[4rem_auto] flex-wrap place-items-center gap-4 overflow-y-auto py-2 @sm:grid-cols-[repeat(2,4rem_auto)] @lg:grid-cols-[repeat(3,4rem_auto)]">
				{exocompParts
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((e) => (
						<div key={e.name} className="contents">
							<img
								className="aspect-square border border-white bg-black/80 object-cover hover:bg-white/10 focus:border-white/80 active:bg-white/30"
								src={e.image}
								onClick={() =>
									setParts(
										produce((draft) => {
											const foundItem = draft.find((i) => i.name === e.name);
											if (!foundItem) {
												draft.push({ name: e.name, count: 1 });
											} else {
												foundItem.count += 1;
											}
										}),
									)
								}
							/>
							<p className="w-full text-sm leading-tight text-balance">{e.name}</p>
						</div>
					))}
			</div>
			<CargoList
				className="min-h-40 border border-white bg-black/80"
				onClick={async (name) =>
					setParts(
						produce((draft) => {
							const foundItem = draft.find((i) => i.name === name);
							if (!foundItem) {
								draft.push({ name: name, count: 0 });
							} else {
								foundItem.count = Math.max(0, foundItem.count - 1);
							}
						}),
					)
				}
				selectedContainerId={-1}
				selectedRoom={{
					id: -1,
					contents: Object.fromEntries(
						parts.map(({ name, count }) => [name, { count, temperature: 0 }]),
					),
				}}
				enRouteContainer={{ id: -1, entityState: "idle" }}
			/>
		</>
	);
}

function Logs() {
	const { shipId } = useStation();
	const [exocomps] = q.exocomps.exocomps.useNetRequest({ shipId });

	const selectedContainerId = useShipMapStore((state) => state.selectedContainerId);

	const selectedExocomp = exocomps.find((e) => e.id === selectedContainerId);

	return (
		<>
			<p className="-mb-2">Logs</p>
			<div className="panel min-h-0 flex-auto">
				<div className="faded-scroll-y flex flex-col-reverse overflow-y-auto p-4">
					{selectedExocomp?.logs
						.sort((a, b) => b.timestamp - a.timestamp)
						.map((log) => (
							<p key={log.timestamp}>
								{fromDate(new Date(log.timestamp))} — {log.text}
							</p>
						))}
				</div>
			</div>
		</>
	);
}
