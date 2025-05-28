import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { Icon } from "@thorium/ui/Icon";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import { useState } from "react";

export function ObjectivesCore() {
	const { shipId } = useStation();

	const [objectives] = q.objectives.get.useNetRequest({ shipId });
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
							<div className="flex gap-0.5">
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
								<Button
									className="btn-success btn-xs"
									aria-label="Complete"
									onClick={() =>
										q.objectives.setState.netSend({
											objectiveId: objective.id,
											state: "complete",
										})
									}
								>
									<Icon name="check" />
								</Button>
								<Button
									className="btn-error btn-xs"
									aria-label="Cancel"
									onClick={() =>
										q.objectives.setState.netSend({
											objectiveId: objective.id,
											state: "cancelled",
										})
									}
								>
									<Icon name="x" />
								</Button>
							</div>
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

						q.objectives.add.netSend({ shipId, title, description, priority });
						e.currentTarget.reset();
						setAdding(false);
					}}
				>
					<div className="flex flex-col w-full gap-1 flex-wrap items-start">
						<div className="flex-1 w-full">
							<Input
								label="Title"
								name="objective"
								required
								className="input-sm"
							/>
						</div>
						<div className="flex-1 w-full">
							<Input
								as="textarea"
								name="description"
								label="Description"
								className="textarea-sm"
							/>
						</div>
						<div className="flex-1 w-full">
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
