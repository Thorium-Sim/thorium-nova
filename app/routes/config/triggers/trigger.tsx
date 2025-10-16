import { q } from "@thorium/context/AppContext";
import { useNavigate, useParams } from "react-router";
import { Navigate } from "@thorium/components/Navigate";
import Input from "@thorium/ui/Input";
import { useState } from "react";
import { toast } from "@thorium/context/ToastContext";
import InfoTip from "@thorium/ui/InfoTip";
import { AddBlockButton } from "@thorium/components/timelineBuilder/AddBlockMenu";
import { SortableBlocks } from "@thorium/components/timelineBuilder/SortableBlocks";
import { Button } from "react-aria-components";
import Checkbox from "@thorium/ui/Checkbox";

export default function TriggerLayout() {
	const { macroId, pluginId } = useParams() as {
		macroId: string;
		pluginId: string;
	};

	const navigate = useNavigate();

	const [trigger] = q.plugin.macro.get.useNetRequest({
		pluginId,
		macroId,
	});
	const [error, setError] = useState(false);

	if (!macroId || !trigger)
		return <Navigate to={`/config/${pluginId}/trigger`} />;

	return (
		<div className="flex-1 flex flex-col">
			<div className="flex justify-between w-full gap-2">
				<div className="flex-1">
					<div>
						<Input
							labelHidden={false}
							isInvalid={error}
							invalidMessage="Name is required"
							label="Trigger Name"
							placeholder="Trigger"
							defaultValue={trigger.name}
							onChange={() => setError(false)}
							onBlur={async (e: any) => {
								if (!e.target.value) return setError(true);
								try {
									const result = await q.plugin.macro.update.netSend({
										pluginId,
										macroId,
										name: e.target.value,
									});
									navigate(`/config/${pluginId}/trigger/${result.macroId}`);
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error renaming trigger",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
					</div>
					<div className="pb-4 flex gap-2">
						<div className="flex-1">
							<Input
								labelHidden={false}
								label="Category"
								type="textarea"
								defaultValue={trigger.category}
								onBlur={(e: any) =>
									q.plugin.macro.update.netSend({
										pluginId,
										macroId,
										category: e.target.value,
									})
								}
							/>
						</div>
						<div className="flex-1">
							<Checkbox
								labelHidden={false}
								label="Active"
								helperText="Whether the trigger will be immediately activated when a flight starts."
								defaultChecked={trigger.active}
								onChange={(e: any) =>
									q.plugin.macro.update.netSend({
										pluginId,
										macroId,
										active: e.target.checked,
									})
								}
							/>
						</div>
					</div>
				</div>
				<div className="flex-1">
					<Input
						as="textarea"
						className="!h-32"
						labelHidden={false}
						label="Description"
						defaultValue={trigger.description}
						onBlur={(e: any) =>
							q.plugin.macro.update.netSend({
								pluginId,
								macroId,
								description: e.target.value,
							})
						}
					/>
				</div>
			</div>
			<h3 className="text-xl font-semibold">
				Blocks{" "}
				<InfoTip>
					Compose blocks together to create the logic for your trigger. Get
					entity references, store properties in variables, and execute actions.
				</InfoTip>
			</h3>
			<div className="flex-1 overflow-y-auto overflow-x-hidden">
				{!trigger?.blocks || trigger?.blocks?.length === 0 ? (
					<div>
						<p>No blocks added to trigger.</p>
						<AddBlockButton
							executionType={["main"]}
							onAddBlock={async (type, init) => {
								await q.plugin.macro.block.add.netSend({
									pluginId,
									macroId,
									blockType: type,
									init,
								});
							}}
						>
							<Button className="btn btn-sm btn-outline btn-success">
								Add Block
							</Button>
						</AddBlockButton>
					</div>
				) : (
					<SortableBlocks
						executionType={["main"]}
						blocks={trigger?.blocks || []}
						onDragEnd={({ active, overIndex }) =>
							q.plugin.macro.block.reorder.netSend({
								pluginId,
								macroId,
								blockId: active.id as string,
								newIndex: Number(overIndex),
							})
						}
						onUpdate={(block, property, value) => {
							const { id, type, ...properties } = block;
							q.plugin.macro.block.update.netSend({
								pluginId,
								macroId,
								blockId: block.id,
								properties: { ...properties, [property]: value },
							});
						}}
						onReplace={(id, blocks) => {
							q.plugin.macro.block.replace.netSend({
								pluginId,
								macroId,
								blockId: id,
								blocks,
							});
						}}
						onRemove={(id) =>
							q.plugin.macro.block.delete.netSend({
								pluginId,
								macroId,
								blockId: id,
							})
						}
					/>
				)}
			</div>
			<AddBlockButton
				executionType={["main"]}
				onAddBlock={async (type, init) => {
					await q.plugin.macro.block.add.netSend({
						pluginId,
						macroId,
						blockType: type,
						init,
					});
				}}
			>
				<Button className="btn btn-sm btn-outline btn-success">
					Add Block
				</Button>
			</AddBlockButton>
		</div>
	);
}
