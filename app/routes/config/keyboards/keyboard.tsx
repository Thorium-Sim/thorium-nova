import { isSortable } from "@dnd-kit/react/sortable";
import { Keyboard, type MetaList } from "@thorium/components/Keyboard";
import { Navigate } from "@thorium/components/Navigate";
import { AddBlockButton } from "@thorium/components/timelineBuilder/AddBlockMenu";
import { DefinedVariableProvider } from "@thorium/components/timelineBuilder/DefinedVariableContext";
import { SortableBlocks } from "@thorium/components/timelineBuilder/SortableBlocks";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import { useMenubar } from "@thorium/ui/Menubar";
import { getBitmaskFromMeta } from "@thorium/utils/keyboardMetaBitmask";
import { camelCase, capitalCase } from "change-case";
import { Suspense, useState } from "react";
import { Button } from "react-aria-components";
import { href, useNavigate } from "react-router";

import type { Route } from "./+types/keyboard";

const keyboardVariables = ["shipId", "station", "keyCode"] as const;
export default function KeyboardLayout({ params: { keyboardId, pluginId } }: Route.ComponentProps) {
	useMenubar({
		backTo: href(`/config/:pluginId/keyboards`, { pluginId }),
	});
	const navigate = useNavigate();

	const [keyboard] = q.plugin.keyboard.get.useNetRequest({
		pluginId,
		keyboardId,
	});
	const [error, setError] = useState(false);

	if (!keyboardId || !keyboard)
		return <Navigate to={href(`/config/:pluginId/keyboards`, { pluginId })} />;

	return (
		<div className="grid h-[calc(100%-6rem)] grid-cols-6 grid-rows-[auto_auto_auto_1fr] gap-2 p-4">
			<h1 className="col-span-6 text-3xl font-bold">{keyboard.name}</h1>
			<div>
				<div>
					<Input
						labelHidden={false}
						isInvalid={error}
						invalidMessage="Name is required"
						label="Keyboard Name"
						placeholder="Sound Effects"
						defaultValue={keyboard.name}
						onChange={() => setError(false)}
						onBlur={async (e: any) => {
							if (!e.target.value) return setError(true);
							try {
								const result = await q.plugin.keyboard.update.netSend({
									pluginId,
									keyboardId,
									name: e.target.value,
								});
								void navigate(
									href("/config/:pluginId/keyboards/:keyboardId", {
										pluginId,
										keyboardId: result.keyboardId,
									}),
								);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error renaming keyboard",
										body: err.message,
										color: "error",
									});
								}
							}
						}}
					/>
				</div>
				<div className="flex gap-2 pb-4">
					<div className="flex-1">
						<Input
							labelHidden={false}
							label="Category"
							type="textarea"
							defaultValue={keyboard.category}
							onBlur={(e: any) =>
								q.plugin.keyboard.update.netSend({
									pluginId,
									keyboardId,
									category: e.target.value,
								})
							}
						/>
					</div>
				</div>
			</div>
			<div>
				<Input
					as="textarea"
					className="h-26!"
					labelHidden={false}
					label="Description"
					defaultValue={keyboard.description}
					onBlur={(e: any) =>
						q.plugin.keyboard.update.netSend({
							pluginId,
							keyboardId,
							description: e.target.value,
						})
					}
				/>
			</div>
			<KeyboardEditor pluginId={pluginId} keyboardId={keyboardId} />
		</div>
	);
}

function KeyboardEditor({ pluginId, keyboardId }: { pluginId: string; keyboardId: string }) {
	const [metaKeys, setMetaKeys] = useState<MetaList[]>([]);

	const [selectedKey, setSelectedKey] = useState<string | null>(null);
	const selected = [
		...metaKeys.flatMap((m) =>
			m === "capsLock" ? "CapsLock" : [`${capitalCase(m)}Right`, `${capitalCase(m)}Left`],
		),
		selectedKey || [],
	].flat();

	return (
		<>
			<div className="col-span-4 max-h-72 rounded bg-black/70 p-2">
				<Keyboard
					extended
					selected={selected}
					onPointerDown={(key) => {
						switch (key.keyCode) {
							case "ShiftRight":
							case "ShiftLeft":
							case "ControlRight":
							case "ControlLeft":
							case "AltRight":
							case "AltLeft":
							case "MetaRight":
							case "MetaLeft":
							case "CapsLock":
								const meta = camelCase(
									key.keyCode.replace("Left", "").replace("Right", ""),
								) as MetaList;
								setMetaKeys((m) => (m.includes(meta) ? m.filter((c) => c !== meta) : [...m, meta]));

								break;
							case "":
							case "Escape":
								break;
							default:
								setSelectedKey(key.keyCode);
						}
					}}
				/>
			</div>
			{selectedKey ? (
				<>
					<h2 className="col-span-6 text-xl">
						{selectedKey}
						{metaKeys.length > 0 ? ` + ${metaKeys.join(" + ")}` : ""}
					</h2>
					<div className="col-span-3 min-h-0">
						<p>
							Press Actions{" "}
							<InfoTip>
								Compose blocks together to perform actions or create logic when this key is pressed
								down. Local variables are transferred to the release blocks.
								<p>The following variables are available:</p>
								<ul className="ml-4 list-disc">
									{keyboardVariables.map((a) => (
										<li key={a}>{a}</li>
									))}
								</ul>
							</InfoTip>
						</p>
						<Suspense>
							<KeyboardBlocks
								pluginId={pluginId}
								keyboardId={keyboardId}
								keyId={`${selectedKey}${metaKeys.length > 0 ? `-${getBitmaskFromMeta(metaKeys)}` : ""}`}
								pressType="downBlocks"
							/>
						</Suspense>
					</div>
					<div className="col-span-3 min-h-0">
						<p>
							Release Actions{" "}
							<InfoTip>
								Compose blocks together to perform actions or create logic when this key is
								released. Use local variables from the press blocks.
								<p>The following variables are available:</p>
								<ul className="ml-4 list-disc">
									{keyboardVariables.map((a) => (
										<li key={a}>{a}</li>
									))}
								</ul>
							</InfoTip>
						</p>
						<Suspense>
							<KeyboardBlocks
								pluginId={pluginId}
								keyboardId={keyboardId}
								keyId={`${selectedKey}${metaKeys.length > 0 ? getBitmaskFromMeta(metaKeys) : ""}`}
								pressType="upBlocks"
							/>
						</Suspense>
					</div>
				</>
			) : null}
		</>
	);
}

function KeyboardBlocks({
	pluginId,
	keyboardId,
	keyId,
	pressType,
}: {
	pluginId: string;
	keyboardId: string;
	keyId: string;
	pressType: "downBlocks" | "upBlocks";
}) {
	const [keyboard] = q.plugin.keyboard.get.useNetRequest({
		pluginId,
		keyboardId,
	});
	const blocks = keyboard.keys.find((key) => key.id === keyId)?.[pressType] || [];
	return (
		<DefinedVariableProvider variables={[...keyboardVariables]}>
			<div className="h-full flex-1 overflow-x-hidden overflow-y-auto">
				{blocks.length === 0 ? (
					<div>
						<p>No blocks added to key.</p>
						<AddBlockButton
							executionType={["main"]}
							timelineType="keyboard"
							onAddBlock={async (type, init) => {
								await q.plugin.keyboard.block.add.netSend({
									pluginId,
									keyboardId,
									keyId,
									pressType,
									blockType: type,
									init,
								});
							}}
						>
							<Button className="btn btn-sm btn-outline btn-success">Add Block</Button>
						</AddBlockButton>
					</div>
				) : (
					<SortableBlocks
						executionType={["main"]}
						blocks={blocks}

						onDragEnd={(event) => {
							if (event.canceled || !event.operation.source || !isSortable(event.operation.source))
								return;
							void q.plugin.keyboard.block.reorder.netSend({
								pluginId,
								keyboardId,
								keyId,
								pressType,
								blockId: event.operation.source.id as string,
								newIndex: event.operation.source.index,
							});
						}}
						onUpdate={async (block, property, value) => {
							const { id: _, type: __, ...properties } = block;
							await q.plugin.keyboard.block.update.netSend({
								pluginId,
								keyboardId,
								keyId,
								pressType,
								blockId: block.id,
								properties: { ...properties, [property]: value },
							});
						}}
						onReplace={(id, blocks) => {
							void q.plugin.keyboard.block.replace.netSend({
								pluginId,
								keyboardId,
								keyId,
								pressType,
								blockId: id,
								blocks,
							});
						}}
						onRemove={(id) =>
							q.plugin.keyboard.block.delete.netSend({
								pluginId,
								keyboardId,
								keyId,
								pressType,
								blockId: id,
							})
						}
					/>
				)}
			</div>
			<AddBlockButton
				executionType={["main", "prerequisite"]}
				timelineType="keyboard"
				onAddBlock={async (type, init) => {
					await q.plugin.keyboard.block.add.netSend({
						pluginId,
						keyboardId,
						keyId,
						pressType,
						blockType: type,
						init,
					});
				}}
			>
				<Button className="btn btn-sm btn-outline btn-success">Add Block</Button>
			</AddBlockButton>
		</DefinedVariableProvider>
	);
}
