import {
	ComponentPropertySelect,
	MadLibSelect,
	type BlockProps,
} from "@thorium/components/timelineBuilder/BlockInputs";
import Checkbox from "@thorium/ui/Checkbox";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import { produce } from "immer";
import { Button } from "react-aria-components";

export function EntityCondition({ checks, match, persist, update }: BlockProps<"EntityCondition">) {
	return (
		<>
			<div className="flex items-center gap-1">
				Wait until{" "}
				<MadLibSelect
					value={match}
					onChange={(value) => update("match", value as any)}
					options={["any", "one", "no"]}
				/>{" "}
				entity has
				<div className="flex flex-col gap-2">
					{checks.map((c, i) => (
						<div key={i} className="flex items-center gap-1">
							<ComponentPropertySelect
								component={c.component}
								property={c.property}
								comparison={c.comparison || ""}
								value={c.value || ""}
								setComponent={(value) =>
									update(
										"checks",
										produce(checks, (draft) => {
											draft[i].component = value;
										}),
									)
								}
								setComparison={(value) =>
									update(
										"checks",
										produce(checks, (draft) => {
											draft[i].comparison = value;
										}),
									)
								}
								setProperty={(value) =>
									update(
										"checks",
										produce(checks, (draft) => {
											draft[i].property = value;
										}),
									)
								}
								setValue={(value) =>
									update(
										"checks",
										produce(checks, (draft) => {
											draft[i].value = value;
										}),
									)
								}
							/>
							{i === checks.length - 1 ? (
								<Button
									className="btn btn-circle btn-success btn-xs !p-0 !text-lg"
									onPress={() =>
										update(
											"checks",
											produce(checks, (draft) => {
												draft.push({ component: "", property: "" });
											}),
										)
									}
								>
									<Icon name="plus" />
								</Button>
							) : (
								<span>and</span>
							)}
							{checks.length > 1 ? (
								<>
									<div className="flex-1" />
									<Button
										className="btn btn-circle btn-error btn-xs !p-0 !text-lg"
										onPress={() => {
											update(
												"checks",
												produce(checks, (draft) => {
													draft.splice(i, 1);
												}),
											);
										}}
									>
										<Icon name="minus" />
									</Button>
								</>
							) : null}
						</div>
					))}
				</div>
			</div>
			<Checkbox
				checked={persist}
				onChange={(e) => update("persist", e.currentTarget.checked)}
				label={
					<>
						Persist{" "}
						<InfoTip>
							Whether this trigger condition will continue to exist after the timeline step has
							proceeded. Set this to true if you want the trigger remain active. It will still
							automatically deactivate once it has been triggered once.
						</InfoTip>
					</>
				}
			/>
		</>
	);
}
