import { AddBlockMenu } from "@thorium/routes/config/timelines/builder/AddBlockMenu";
import {
	ValueInput,
	MadLibSelect,
	type BlockProps,
} from "@thorium/routes/config/timelines/builder/BlockInputs";
import { BlockWrapper } from "@thorium/routes/config/timelines/builder/BlockWrapper";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { useState } from "react";

export function IfCondition({}: BlockProps<"IfCondition">) {
	const [conditions, setConditions] = useState([{}]);

	return (
		<>
			<div className="flex gap-2">
				If{" "}
				<div className="flex flex-col gap-2">
					{conditions.map((c, i) => (
						<div key={i} className="flex items-center gap-1">
							<ValueInput />{" "}
							<MadLibSelect
								options={["=", "!=", ">", ">=", "<", "<=", "contains"]}
							/>{" "}
							<ValueInput />
							{i === conditions.length - 1 ? (
								<Button
									className="btn-circle btn-success btn-xs !text-lg !p-0"
									onClick={() => setConditions((c) => [...c, {}])}
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
											setConditions((c) => c.slice(0, conditions.length - 1))
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
			<AddBlockMenu onAddBlock={() => {}} />
		</>
	);
}
