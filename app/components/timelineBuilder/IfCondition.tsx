import { AddBlockMenu } from "@thorium/components/timelineBuilder/AddBlockMenu";
import {
	ValueInput,
	MadLibSelect,
	type BlockProps,
} from "@thorium/components/timelineBuilder/BlockInputs";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import { produce } from "immer";

export function IfCondition({
	conditions,
	update,
	definedVariables = [],
}: BlockProps<"IfCondition"> & { definedVariables: string[] }) {
	return (
		<>
			<div className="absolute left-0 top-0">
				<InfoTip>
					<p>The following variables are available:</p>
					<ul className="ml-4">
						{definedVariables.map((d) => (
							<li key={d} className="list-disc">
								<code>{d}</code>
							</li>
						))}
					</ul>
				</InfoTip>
			</div>
			<div className="flex gap-2">
				If{" "}
				<div className="flex flex-col gap-2">
					{conditions.map(({ value1, value2, comparison }, i) => (
						<div key={i} className="flex items-center gap-1">
							<ValueInput
								value={value1}
								onChange={(value) =>
									update(
										"conditions",
										produce(conditions, (draft) => {
											draft[i].value1 = value;
										}),
									)
								}
							/>{" "}
							<MadLibSelect
								value={comparison}
								onChange={(value) =>
									update(
										"conditions",
										produce(conditions, (draft) => {
											draft[i].comparison = value;
										}),
									)
								}
								options={[
									"=",
									"!=",
									">",
									">=",
									"<",
									"<=",
									"contains",
									"is empty",
									"is not empty",
								]}
							/>{" "}
							{["is empty", "is not empty"].includes(comparison) ? null : (
								<ValueInput
									value={value2}
									onChange={(value) =>
										update(
											"conditions",
											produce(conditions, (draft) => {
												draft[i].value2 = value;
											}),
										)
									}
								/>
							)}
							{i === conditions.length - 1 ? (
								<Button
									className="btn-circle btn-success btn-xs !text-lg !p-0"
									onClick={() =>
										update("conditions", [
											...conditions,
											{ value1: "", value2: "", comparison: "=" },
										])
									}
								>
									<Icon name="plus" />
								</Button>
							) : (
								<span>and</span>
							)}
							{conditions.length > 1 ? (
								<>
									<div className="flex-1" />
									<Button
										className="btn-circle btn-error btn-xs !text-lg !p-0"
										onClick={() =>
											update(
												"conditions",
												produce(conditions, (draft) => {
													draft.splice(i, 1);
												}),
											)
										}
									>
										<Icon name="minus" />
									</Button>
								</>
							) : null}
						</div>
					))}
				</div>
			</div>
		</>
	);
}
