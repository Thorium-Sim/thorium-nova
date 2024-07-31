import { q } from "@client/context/AppContext";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import { useState } from "react";

export function ObjectivesCore() {
	const [objectives] = q.objectives.get.useNetRequest({});
	const [adding, setAdding] = useState(false);
	return (
		<div className="flex flex-col gap-1 h-full">
			<div className="flex-1 overflow-y-auto">
				{objectives.map((objective) => (
					<div
						key={objective.id}
						className="flex items-center gap-1 last-of-type:border-transparent border-b border-b-white/50 py-1"
					>
						<div className="flex-1">
							<div className="font-bold">{objective.title}</div>
							<div className="text-sm">{objective.description}</div>
						</div>
						<div>
							<Select
								label="State"
								labelHidden
								size="xs"
								items={[
									{ id: "active", label: "Active" },
									{ id: "complete", label: "Complete" },
									{ id: "cancelled", label: "Cancelled" },
								]}
								selected={objective.state}
								setSelected={async (state) => {
									if (Array.isArray(state)) return;
									await q.objectives.setState.netSend({
										objectiveId: objective.id,
										state,
									});
								}}
							/>
							<Checkbox
								label="Crew Complete"
								checked={objective.crewComplete}
								onChange={(e) =>
									q.objectives.setCrewComplete.netSend({
										objectiveId: objective.id,
										crewComplete: e.target.checked,
									})
								}
							/>
						</div>
					</div>
				))}
			</div>
			{adding ? (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						const form = e.currentTarget;
						const title = form.objective.value;
						const description = form.description.value;
						const priority = Number(form.priority.value) || 1;

						q.objectives.add.netSend({ title, description, priority });
						e.currentTarget.reset();
						setAdding(false);
					}}
				>
					<div className="flex gap-1 flex-wrap items-start">
						<div className="flex-1">
							<Input
								label="Title"
								name="objective"
								required
								className="input-sm"
							/>
						</div>
						<div className="flex-1">
							<Input
								as="textarea"
								name="description"
								label="Description"
								className="input-sm"
							/>
						</div>
						<div className="flex-1">
							<Input
								label="Priority"
								className="input-sm"
								name="priority"
								type="number"
								defaultValue={1}
							/>
							<p className="text-sm">Higher number = higher priority</p>
						</div>
					</div>
					<div className="flex gap-1 flex-wrap">
						<Button
							type="reset"
							className="flex-1 btn-xs btn-error"
							onClick={() => setAdding(false)}
						>
							Cancel
						</Button>
						<Button type="submit" className="flex-1 btn-xs btn-success">
							Add Objective
						</Button>
					</div>
				</form>
			) : (
				<div>
					<Button
						className="btn-xs btn-success"
						onClick={() => setAdding(true)}
					>
						Add Objective
					</Button>
				</div>
			)}
		</div>
	);
}
