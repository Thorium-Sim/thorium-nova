import { isSortable } from "@dnd-kit/react/sortable";
import type { TimelineStep } from "@thorium/.server/classes/Plugins/TimelineStep";
import { AddBlockButton } from "@thorium/components/timelineBuilder/AddBlockMenu";
import {
	DefinedVariableProvider,
	useDefinedVariables,
} from "@thorium/components/timelineBuilder/DefinedVariableContext";
import { SortableBlocks } from "@thorium/components/timelineBuilder/SortableBlocks";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { InterpolateInfo } from "@thorium/routes/config/reports/InterpolateInfo";
import { reportVariableNames } from "@thorium/routes/config/reports/reportAvailableVariables";
import { trainingVariableNames } from "@thorium/routes/config/trainings/trainingAvailableVariables";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import { SortableList } from "@thorium/ui/SortableItem";
import TagInput from "@thorium/ui/TagInput";
import { parseSchema } from "@thorium/utils/zodAutoForm";
import { parseSchema as parseJsonSchema } from "json-schema-to-zod";
import { Suspense } from "react";
import { Button as RAButton } from "react-aria-components";

export function TimelineStepEditor({
	pluginId,
	timelineId,
	timelineType,
	step,
}: {
	pluginId: string;
	timelineId: string;
	timelineType: "reports" | "missions" | "trainings";
	step: TimelineStep;
}) {
	const stepId = step.id;
	const variables =
		timelineType === "reports"
			? reportVariableNames
			: timelineType === "trainings"
				? trainingVariableNames
				: [];
	const getActionPresetValues = useGetActionPresetValue(timelineType);
	return (
		<div className="flex flex-1 flex-col">
			<div className="flex w-full justify-between gap-2">
				<div className="flex-1">
					<Input
						labelHidden={false}
						label="Step Name"
						placeholder="Retrieve Information"
						key={step.id}
						defaultValue={step.name}
						className="input-xs"
						labelProps={{ className: "text-xs" }}
						onBlur={async (e: any) => {
							try {
								await q.plugin.timeline.step.update.netSend({
									pluginId,
									timelineId,
									timelineType,
									stepId,
									name: e.target.value,
								});
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error renaming step",
										body: err.message,
										color: "error",
									});
								}
							}
						}}
					/>
					<TagInput
						className="input-xs flex-1"
						inputClassName="input-xs"
						label="Tags"
						tags={step.tags}
						onAdd={(tag) => {
							if (step.tags.includes(tag)) return;
							q.plugin.timeline.step.update.netSend({
								pluginId,
								timelineId,
								timelineType,
								stepId,
								tags: [...step.tags, tag],
							});
						}}
						onRemove={(tag) => {
							if (!step.tags.includes(tag)) return;
							q.plugin.timeline.step.update.netSend({
								pluginId,
								timelineId,
								timelineType,
								stepId,
								tags: step.tags.filter((t) => t !== tag),
							});
						}}
					/>
				</div>
				<div className="flex-1">
					<Input
						as="textarea"
						className="input-xs"
						labelProps={{ className: "text-xs" }}
						labelHidden={false}
						label={
							timelineType === "reports" ? (
								<>
									Instructions
									<InterpolateInfo className="static" />
								</>
							) : (
								"Description"
							)
						}
						helperText={
							timelineType === "reports" ? (
								<>
									The instructions that will be displayed to the crew in the damage report for this
									step. You can use variables from your blocks in this field.
								</>
							) : null
						}
						key={step.id}
						defaultValue={step.description}
						onBlur={(e: any) =>
							q.plugin.timeline.step.update.netSend({
								pluginId,
								timelineId,
								timelineType,
								stepId,
								description: e.target.value,
							})
						}
					/>
				</div>
			</div>
			<h3 className="font-semibold">
				Blocks{" "}
				<InfoTip>
					<p>
						Compose blocks together to create the logic for your timeline step. Get entity
						references, store properties in variables, and execute actions.
					</p>
					<p>The following variables are available:</p>
					<ul className="ml-4 list-disc">
						{variables.map((a) => (
							<li key={a}>{a}</li>
						))}
					</ul>
				</InfoTip>
			</h3>
			<DefinedVariableProvider variables={[...variables]}>
				<Suspense>
					<div className="flex-1 overflow-x-hidden overflow-y-auto text-sm">
						{!step?.blocks || step?.blocks?.length === 0 ? (
							<div>
								<p>No blocks added to step.</p>
								<AddBlockButton
									executionType={["main"]}
									timelineType={timelineType}
									onAddBlock={async (type, init, initOverrides) => {
										if (
											type === "Action" &&
											init &&
											"action" in init &&
											typeof init.action === "string"
										) {
											// @ts-expect-error
											init.values = getActionPresetValues(init.action, init.values, initOverrides);
										}

										await q.plugin.timeline.step.block.add.netSend({
											pluginId,
											timelineId,
											timelineType,
											stepId,
											blockType: type,
											init,
										});
									}}
								>
									<RAButton className="btn btn-sm btn-outline btn-success">Add Block</RAButton>
								</AddBlockButton>
							</div>
						) : (
							<SortableBlocks
								timelineType={timelineType}
								executionType={["main"]}
								blocks={step?.blocks || []}
								onDragEnd={(event) => {
									if (
										event.canceled ||
										!event.operation.source ||
										!isSortable(event.operation.source)
									)
										return;
									q.plugin.timeline.step.block.reorder.netSend({
										pluginId,
										timelineId,
										timelineType,
										stepId,
										blockId: event.operation.source.id as string,
										newIndex: event.operation.source.index,
									});
								}}
								onUpdate={async (block, property, value) => {
									await q.plugin.timeline.step.block.update.netSend({
										pluginId,
										timelineId,
										timelineType,
										stepId,
										blockId: block.id,
										properties: { [property]: value },
									});
								}}
								onReplace={(id, blocks) => {
									q.plugin.timeline.step.block.replace.netSend({
										pluginId,
										timelineId,
										timelineType,
										stepId,
										blockId: id,
										blocks,
									});
								}}
								onRemove={(id) =>
									q.plugin.timeline.step.block.delete.netSend({
										pluginId,
										timelineId,
										timelineType,
										stepId,
										blockId: id,
									})
								}
							/>
						)}
					</div>
				</Suspense>

				<AddBlockButton
					timelineType={timelineType}
					executionType={["main"]}
					onAddBlock={async (type, init, initOverrides) => {
						if (type === "Action" && init && "action" in init && typeof init.action === "string") {
							// @ts-expect-error
							init.values = getActionPresetValues(init.action, init.values, initOverrides);
						}
						await q.plugin.timeline.step.block.add.netSend({
							pluginId,
							timelineId,
							timelineType,
							stepId,
							blockType: type,
							init,
						});
					}}
				>
					<RAButton className="btn btn-sm btn-outline btn-success">Add Block</RAButton>
				</AddBlockButton>
			</DefinedVariableProvider>
		</div>
	);
}

export function StepButtons({
	pluginId,
	timelineId,
	timelineType,
	stepId,
	setStep,
}: {
	pluginId: string;
	timelineId: string;
	stepId: string | undefined | null;
	timelineType: "reports" | "missions" | "trainings";
	setStep: (stepId: string | null) => void;
}) {
	const prompt = usePrompt();

	return (
		<div className="mb-2 flex">
			<Button
				className="btn-xs btn-success grow"
				onClick={async () => {
					const name = await prompt("What is the new step name?");
					if (!name) return;
					const step = await q.plugin.timeline.step.add.netSend({
						pluginId,
						timelineId,
						timelineType,
						name,
					});
					setStep(`${step.stepId}`);
				}}
			>
				Add Step
			</Button>
			<Button
				className="btn-xs btn-warning grow"
				disabled={!stepId}
				onClick={async () => {
					const name = await prompt("What is the new step name?");
					if (!name || !stepId) return;
					const step = await q.plugin.timeline.step.insert.netSend({
						pluginId,
						timelineId,
						timelineType,
						stepId,
						name,
					});
					setStep(`${step.stepId}`);
				}}
			>
				Insert Step
			</Button>
			<Button
				className="btn-xs btn-info grow"
				disabled={!stepId}
				onClick={async () => {
					if (!stepId) return;
					const step = await q.plugin.timeline.step.duplicate.netSend({
						pluginId,
						timelineId,
						timelineType,
						stepId,
					});
					setStep(`${step.stepId}`);
				}}
			>
				Duplicate
			</Button>
			<Button
				className="btn-xs btn-error grow"
				disabled={!stepId}
				onClick={async () => {
					if (!stepId) return;
					const { alternateStep } = await q.plugin.timeline.step.delete.netSend({
						pluginId,
						timelineId,
						timelineType,
						stepId,
					});
					setStep(alternateStep);
				}}
			>
				Delete
			</Button>
		</div>
	);
}

export function StepList({
	pluginId,
	timelineId,
	timelineType,
	stepId,
	setStep,
}: {
	pluginId: string;
	timelineId: string;
	timelineType: "reports" | "missions" | "trainings";

	stepId?: string | null;
	setStep: (id: string) => void;
}) {
	const [item] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
		timelineType,
	});

	const steps = item.steps.map((s) => ({ id: s.id, children: s.name }));

	return (
		<SortableList
			items={steps}
			onDragEnd={async (event) => {
				if (event.canceled || !event.operation.source || !isSortable(event.operation.source))
					return;

				const result = await q.plugin.timeline.step.reorder.netSend({
					pluginId,
					timelineId,
					timelineType,
					stepId: event.operation.source.id as string,
					newIndex: event.operation.source.index,
				});
				if (result) {
					setStep(result.stepId);
				}
			}}
			selectedItem={stepId}
			className="mb-2"
		/>
	);
}

export function PrerequisiteBlocks({
	pluginId,
	timelineId,
	timelineType,
	prerequisiteBlocks,
}: {
	pluginId: string;
	timelineId: string;
	timelineType: "reports" | "missions" | "trainings";
	prerequisiteBlocks: TimelineBlock[];
}) {
	const variables =
		timelineType === "reports"
			? reportVariableNames
			: timelineType === "trainings"
				? trainingVariableNames
				: [];

	return (
		<div className="col-span-2 flex flex-col">
			<h3 className="flex items-center text-lg font-medium">
				Prerequisites{" "}
				<InfoTip>
					These blocks will be executed immediately, including any checks, to evaluate if the
					timeline is available to be used. Leave blank to always include this timeline.
				</InfoTip>
			</h3>{" "}
			<DefinedVariableProvider variables={[...variables]}>
				<div className="flex-1 overflow-x-hidden overflow-y-auto">
					{prerequisiteBlocks.length === 0 ? (
						<div>
							<p>No prerequisite blocks.</p>
							<AddBlockButton
								timelineType={timelineType}
								executionType={["prerequisite"]}
								onAddBlock={async (type, init, initOverrides) => {
									if (
										type === "Action" &&
										init &&
										"action" in init &&
										typeof init.action === "string"
									) {
										// @ts-expect-error
										init.values = getActionPresetValues(init.action, init.values, initOverrides);
									}
									await q.plugin.timeline.prerequisiteBlock.add.netSend({
										pluginId,
										timelineId,
										timelineType,
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
							timelineType={timelineType}
							executionType={["prerequisite"]}
							blocks={prerequisiteBlocks}
							onDragEnd={(event) => {
								if (
									event.canceled ||
									!event.operation.source ||
									!isSortable(event.operation.source)
								)
									return;
								void q.plugin.timeline.prerequisiteBlock.reorder.netSend({
									pluginId,
									timelineId,
									timelineType,
									blockId: event.operation.source.id as string,
									newIndex: event.operation.source.index,
								});
							}}
							onUpdate={async (block, property, value) => {
								await q.plugin.timeline.prerequisiteBlock.update.netSend({
									pluginId,
									timelineId,
									timelineType,
									blockId: block.id,
									properties: { [property]: value },
								});
							}}
							onReplace={(id, blocks) => {
								q.plugin.timeline.prerequisiteBlock.replace.netSend({
									pluginId,
									timelineId,
									timelineType,
									blockId: id,
									blocks,
								});
							}}
							onRemove={(id) =>
								q.plugin.timeline.prerequisiteBlock.delete.netSend({
									pluginId,
									timelineId,
									timelineType,
									blockId: id,
								})
							}
						/>
					)}
				</div>
				<AddBlockButton
					timelineType={timelineType}
					executionType={["prerequisite"]}
					onAddBlock={async (type, init, initOverrides) => {
						if (type === "Action" && init && "action" in init && typeof init.action === "string") {
							// @ts-expect-error
							init.values = getActionPresetValues(init.action, init.values, initOverrides);
						}
						await q.plugin.timeline.prerequisiteBlock.add.netSend({
							pluginId,
							timelineId,
							timelineType,
							blockType: type,
							init,
						});
					}}
				>
					<Button className="btn btn-sm btn-outline btn-success">Add Block</Button>
				</AddBlockButton>
			</DefinedVariableProvider>
		</div>
	);
}

export function useGetActionPresetValue(timelineType: "reports" | "missions" | "trainings") {
	const [actions] = q.thorium.actions.useNetRequest();
	const variables =
		timelineType === "reports"
			? reportVariableNames
			: timelineType === "trainings"
				? trainingVariableNames
				: [];
	const localVariables = [...variables, ...useDefinedVariables()];

	return function getActionPresetValues(actionName: string, initValues = {}, initOverrides = true) {
		const action = actions.find((a) => a.action === actionName);
		const actionSchema = action
			? // oxlint-disable-next-line no-eval
				parseSchema(eval(parseJsonSchema(action.input)), {})
			: [];
		let values = initValues;
		const actionInputs = actionSchema.map((a) => a.key);
		for (const actionInput of actionInputs) {
			if (localVariables.includes(actionInput)) {
				if (initOverrides) {
					values = { [actionInput]: `$${actionInput}`, ...values };
				} else {
					values = { ...values, [actionInput]: `$${actionInput}` };
				}
			}
		}
		return values;
	};
}
