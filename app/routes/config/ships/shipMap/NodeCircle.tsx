import { autoUpdate, offset, shift, useFloating } from "@floating-ui/react-dom";
import type { DeckNode } from "@thorium/.server/classes/Plugins/Ship/Deck";
import { q } from "@thorium/context/AppContext";
import useOnClickOutside from "@thorium/hooks/useClickOutside";
import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import { Portal } from "@thorium/ui/Portal";
import { nodeFlags } from "@thorium/utils/flags/DeckNode";
import { useDrag } from "@use-gesture/react";
import { capitalCase } from "change-case";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Disclosure, DisclosurePanel, Heading, Button as RAButton } from "react-aria-components";

import type { PanStateI, updateNodeParams } from "./deckConfig";
import { useTriggerEdgeRender } from "./EdgeContextProvider";

const pixelRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio;

const HandleIsOpen = ({
	open,
	title,
	scrollRef,
}: {
	title: string;
	open: boolean;
	scrollRef: React.RefObject<HTMLDivElement | null>;
}) => {
	const hasMounted = useRef(false);
	useEffect(() => {
		localStorage.setItem(`editor-palette-open-${title}`, JSON.stringify(open));
	}, [title, open]);
	useLayoutEffect(() => {
		if (open && hasMounted.current) {
			setTimeout(() => {
				scrollRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}, 100);
		}
		hasMounted.current = true;
	}, [open, scrollRef]);

	return null;
};

function NodeDisclosure({
	title,
	children,
	defaultOpen = false,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [isDefaultOpen] = useLocalStorage(`node-palette-${title}`, defaultOpen);
	const disclosureRef = useRef<HTMLDivElement | null>(null);
	return (
		<Disclosure defaultExpanded={isDefaultOpen}>
			{({ isExpanded }) => (
				<>
					<HandleIsOpen open={isExpanded} title={title} scrollRef={disclosureRef} />
					<div className="sticky -top-1 z-10 w-full px-2" ref={disclosureRef}>
						<Heading>
							<RAButton slot="trigger" className="btn btn-notice btn-sm btn-block justify-between">
								<span>{title}</span>
								<Icon
									name="chevron-up"
									className={` transition-transform${
										isExpanded ? "rotate-180 transform" : ""
									} h-5 w-5`}
								/>
							</RAButton>
						</Heading>
					</div>

					<DisclosurePanel className="border-b border-b-gray-700 px-2 pt-2">
						{children}
					</DisclosurePanel>
				</>
			)}
		</Disclosure>
	);
}

export function NodeCircle({
	id,
	x,
	y,
	isRoom,
	radius,
	volume,
	flags,
	systems,
	name,
	selected,
	panState,
	updateNode,
	selectNode,
	deselectNode,
	removeNode,
	addingEdges,
	hasCrossDeckConnection,
}: DeckNode & {
	panState: RefObject<PanStateI>;
	updateNode: (params: updateNodeParams) => void;
	selectNode: () => void;
	deselectNode: () => void;
	removeNode: () => void;
	selected: boolean;
	addingEdges: boolean;
	hasCrossDeckConnection: boolean;
}) {
	const {
		x: floatingX,
		y: floatingY,
		strategy,
		update,
		refs,
	} = useFloating({
		placement: "bottom",
		middleware: [shift(), offset({ mainAxis: 10 })],
	});
	const [radiusValue, setRadiusValue] = useState(radius);
	useEffect(() => {
		setRadiusValue(radius);
	}, [radius]);

	const renderEdges = useTriggerEdgeRender(id);
	const bind = useDrag(({ down, movement: [mx, my] }) => {
		if (down) {
			selectNode();
		}
		if (!(refs.reference.current instanceof HTMLDivElement)) return;
		const newX = x * pixelRatio + mx / panState.current.scale;
		const newY = y * pixelRatio + my / panState.current.scale;
		refs.reference.current.style.transform = `translate(${newX}px, ${newY}px)`;
		if (refs.floating.current) {
			autoUpdate(refs.reference.current, refs.floating.current, update);
		}
		renderEdges(newX, newY);
		if (!down) {
			updateNode({
				x: newX / pixelRatio,
				y: newY / pixelRatio,
			});
		}
	});
	useOnClickOutside(refs.floating, () => {
		if (selected && !addingEdges) {
			deselectNode();
		}
	});
	const confirm = useConfirm();
	const [availableSystems] = q.plugin.systems.available.useNetRequest();
	const events = bind();
	return (
		<>
			<div
				ref={refs.setReference}
				className={`rounded-full ${
					selected ? (addingEdges ? "bg-purple-400" : "bg-primary") : "bg-white"
				} absolute -top-1 -left-1 h-2 w-2 cursor-grab touch-none ${
					hasCrossDeckConnection ? "ring-1" : ""
				} ring-white ring-offset-1 ring-offset-black`}
				onMouseDown={(e) => {
					e.stopPropagation();
				}}
				{...events}
				onPointerDown={(event) => {
					events.onPointerDown?.(event);
					selectNode();
				}}
				style={{
					transform: `translate(${x * pixelRatio}px, ${y * pixelRatio}px)`,
				}}
			>
				<div
					className="pointer-events-none absolute rounded-full bg-white/10"
					style={{
						width: `${radiusValue * 2 * pixelRatio}px`,
						height: `${radiusValue * 2 * pixelRatio}px`,
						top: `calc(-${radiusValue * pixelRatio}px + 0.25rem)`,
						left: `calc(-${radiusValue * pixelRatio}px + 0.25rem)`,
					}}
				/>
			</div>
			<Portal>
				{selected && !addingEdges && (
					<div
						ref={refs.setFloating}
						className="z-10 max-h-96 w-52 min-w-max space-y-4 overflow-y-auto rounded bg-black/60 p-2 text-white shadow-lg backdrop-blur"
						style={{
							position: strategy,
							top: floatingY ?? "",
							left: floatingX ?? "",
						}}
						onMouseDown={(e) => e.stopPropagation()}
					>
						<Input
							className="sticky top-0"
							label="Name"
							labelHidden
							autoFocus
							placeholder="Name"
							defaultValue={name}
							onMouseDown={(e) => e.stopPropagation()}
							onChange={(e) => {
								updateNode({ name: e.target.value });
							}}
						/>
						<Checkbox
							label="Is Room"
							defaultChecked={isRoom}
							onChange={(e) => updateNode({ isRoom: e.target.checked })}
						/>
						<NodeDisclosure title="Flags">
							{nodeFlags.map((flag) => (
								<Checkbox
									key={flag}
									label={
										<>
											{capitalCase(flag)}
											<FlagExplainer flag={flag} />
										</>
									}
									defaultChecked={flags.includes(flag)}
									onChange={(e) => {
										if (e.target.checked) {
											updateNode({ flags: [...flags, flag] });
										} else {
											updateNode({ flags: flags.filter((f) => f !== flag) });
										}
									}}
								/>
							))}
						</NodeDisclosure>
						<NodeDisclosure title="Systems">
							{availableSystems.map(({ type }) => (
								<Checkbox
									key={type}
									label={capitalCase(type)}
									defaultChecked={systems.includes(type)}
									onChange={(e) => {
										if (e.target.checked) {
											updateNode({ systems: [...systems, type] });
										} else {
											updateNode({
												systems: systems.filter((t) => t !== type),
											});
										}
									}}
								/>
							))}
						</NodeDisclosure>
						<Input
							label="Radius"
							type="range"
							min={0}
							max={100}
							defaultValue={radius}
							onMouseDown={(e) => e.stopPropagation()}
							onChange={(e) => setRadiusValue(e.target.valueAsNumber)}
							onMouseUp={(e) =>
								updateNode({
									radius: Number((e.target as EventTarget & HTMLInputElement).value),
								})
							}
						/>
						{isRoom && flags.includes("cargo") && (
							<Input
								label="Volume for cargo in liters"
								pattern="[0-9]*"
								defaultValue={volume}
								onChange={(e) => updateNode({ volume: Number(e.target.value) })}
							/>
						)}
						<Button
							className="btn-error btn-sm w-full"
							onClick={async () => {
								if (
									await confirm({
										header: "Delete Node",
										body: "Are you sure you want to delete this node?",
									})
								) {
									removeNode();
								}
							}}
						>
							Delete
						</Button>
					</div>
				)}
			</Portal>
		</>
	);
}

function FlagExplainer({ flag }: { flag: string }) {
	if (flag === "cargo") {
		return <InfoTip>Whether the room accepts cargo.</InfoTip>;
	}
	return null;
}
