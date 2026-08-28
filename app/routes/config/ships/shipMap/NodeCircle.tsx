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
import { logslider } from "@thorium/utils/logSlider";
import { useDrag } from "@use-gesture/react";
import { capitalCase } from "change-case";
import {
	Suspense,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
	type RefObject,
} from "react";
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
	node,
	selected,
	panState,
	updateNode,
	selectNode,
	deselectNode,
	removeNode,
	addingEdges,
	hasCrossDeckConnection,
	sizeRatio,
}: {
	node: DeckNode;
	panState: RefObject<PanStateI>;
	updateNode: (params: updateNodeParams) => void;
	selectNode: () => void;
	deselectNode: () => void;
	removeNode: () => void;
	selected: boolean;
	addingEdges: boolean;
	hasCrossDeckConnection: boolean;
	sizeRatio: number;
}) {
	const { id, x, y, radius } = node;
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

	const events = bind();
	return (
		<>
			<div
				ref={refs.setReference}
				className={`rounded-full ${
					selected ? (addingEdges ? "bg-purple-400" : "bg-primary") : "bg-white"
				} absolute top-0 left-0 h-2 w-2 cursor-grab touch-none ${
					hasCrossDeckConnection ? "ring-2" : ""
				} -translate-1/2 ring-white ring-offset-1 ring-offset-black`}
				onMouseDown={(e) => {
					e.stopPropagation();
				}}
				{...events}
				style={{
					transform: `translate(${x * pixelRatio}px, ${y * pixelRatio}px)`,
					width: `calc(0.5rem / ${sizeRatio})`,
					height: `calc(0.5rem / ${sizeRatio})`,
					// @ts-expect-error
					"--tw-ring-offset-shadow": `0 0 0 calc(1px / ${sizeRatio}) #000`,
					"--tw-ring-shadow": `0 0 0 calc(2px / ${sizeRatio}) #fff`,
				}}
			>
				<div
					className="pointer-events-none absolute -translate-1/2 rounded-full bg-white/10"
					style={{
						width: `${radiusValue * 2 * pixelRatio}px`,
						height: `${radiusValue * 2 * pixelRatio}px`,
						left: `calc(0.5rem / ${sizeRatio} / 2)`,
						top: `calc(0.5rem / ${sizeRatio} / 2)`,
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
						<NodeConfig node={node} removeNode={removeNode} updateNode={updateNode}>
							<Input
								label="Radius"
								type="range"
								min={0.1}
								max={100}
								defaultValue={logslider(0.1, 100, radius, true)}
								onMouseDown={(e) => e.stopPropagation()}
								onChange={(e) => {
									setRadiusValue(logslider(0.1, 100, Number(e.currentTarget.value)));
								}}
								onMouseUp={(e) =>
									updateNode({
										radius: Number(
											logslider(
												0.1,
												100,
												Number((e.target as EventTarget & HTMLInputElement).value),
											),
										),
									})
								}
							/>
						</NodeConfig>
					</div>
				)}
			</Portal>
		</>
	);
}

export function NodeConfig({
	node,
	updateNode,
	removeNode,
	children,
}: {
	node: DeckNode;
	updateNode: (params: updateNodeParams) => void;
	removeNode: () => void;
	children?: ReactNode;
}) {
	const confirm = useConfirm();

	return (
		<>
			<Input
				className="sticky top-0"
				label="Name"
				labelHidden
				autoFocus
				placeholder="Name"
				defaultValue={node.name}
				onMouseDown={(e) => e.stopPropagation()}
				onChange={(e) => {
					updateNode({ name: e.target.value });
				}}
			/>
			<Checkbox
				label="Is Room"
				defaultChecked={node.isRoom}
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
						defaultChecked={node.flags.includes(flag)}
						onChange={(e) => {
							if (e.target.checked) {
								updateNode({ flags: [...node.flags, flag] });
							} else {
								updateNode({ flags: node.flags.filter((f) => f !== flag) });
							}
						}}
					/>
				))}
			</NodeDisclosure>
			<NodeDisclosure title="Systems">
				<Suspense>
					<SystemsList node={node} updateNode={updateNode} />
				</Suspense>
			</NodeDisclosure>
			{children}
			{node.isRoom && node.flags.includes("cargo") && (
				<Input
					label="Volume for cargo in liters"
					pattern="[0-9]*"
					defaultValue={node.volume}
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
		</>
	);
}

function FlagExplainer({ flag }: { flag: string }) {
	if (flag === "cargo") {
		return <InfoTip>Whether the room accepts cargo.</InfoTip>;
	}
	return null;
}

function SystemsList({
	node,
	updateNode,
}: {
	node: DeckNode;
	updateNode: (params: updateNodeParams) => void;
}) {
	const [availableSystems] = q.plugin.systems.available.useNetRequest();
	return availableSystems.map(({ type }) => (
		<Checkbox
			key={type}
			label={capitalCase(type)}
			defaultChecked={node.systems.includes(type)}
			onChange={(e) => {
				if (e.target.checked) {
					updateNode({ systems: [...node.systems, type] });
				} else {
					updateNode({
						systems: node.systems.filter((t) => t !== type),
					});
				}
			}}
		/>
	));
}
