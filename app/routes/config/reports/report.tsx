import type { DragEndEvent } from "@dnd-kit/core";
import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import { SortableList } from "@thorium/ui/SortableItem";
import { Link, Outlet, useLocation, useMatch, useNavigate, useParams } from "react-router";

export default function ReportLayout() {
	const { pathname } = useLocation();

	const { timelineId, pluginId } = useParams() as {
		timelineId: string;
		pluginId: string;
	};

	useMenubar({
		backTo: `/config/${pluginId}/reports`,
	});

	const navigate = useNavigate();
	const confirm = useConfirm();
	const prompt = usePrompt();

	const [item] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
		timelineType: "reports",
	});

	const match = useMatch("config/:pluginId/reports/:timelineId/:stepId/*")?.params.stepId;

	const stepId = match === "details" ? undefined : match;

	if (!timelineId || !item) return <Navigate to={`/config/${pluginId}/reports`} />;

	const steps = item.steps.map((s) => ({ id: s.id, children: s.name }));

	async function handleDragEnd({
		active,
		overIndex,
	}: {
		active: DragEndEvent["active"];
		overIndex: number;
	}) {
		const result = await q.plugin.timeline.step.reorder.netSend({
			pluginId,
			timelineId,
			timelineType: "reports",
			stepId: active.id as string,
			newIndex: Number(overIndex),
		});
		if (result) {
			navigate(result.stepId);
		}
	}

	if (!pathname.endsWith(timelineId)) {
		return (
			<div className="flex h-[calc(100%-2rem)] gap-8 p-8">
				<div className="flex h-full w-72 flex-col">
					<h1 className="mb-2 text-xl font-bold text-white">{item.name}</h1>
					<Link to="details" className={`list-group-item ${match === "details" ? "selected" : ""}`}>
						Report Details
					</Link>
					<hr className="my-2" />
					<SortableList
						items={steps}
						onDragEnd={handleDragEnd}
						selectedItem={stepId}
						className="mb-2"
					/>
					<div className="mb-2 flex">
						<Button
							className="btn-xs btn-success flex-grow"
							onClick={async () => {
								const name = await prompt("What is the new step name?");
								if (!name) return;
								const step = await q.plugin.timeline.step.add.netSend({
									pluginId,
									timelineId,
									timelineType: "reports",
									name,
								});
								navigate(`${step.stepId}`);
							}}
						>
							Add Step
						</Button>
						<Button
							className="btn-xs btn-warning flex-grow"
							disabled={!stepId}
							onClick={async () => {
								const name = await prompt("What is the new step name?");
								if (!name || !stepId) return;
								const step = await q.plugin.timeline.step.insert.netSend({
									pluginId,
									timelineId,
									timelineType: "reports",
									stepId,
									name,
								});
								navigate(`${step.stepId}`);
							}}
						>
							Insert Step
						</Button>
						<Button
							className="btn-xs btn-info flex-grow"
							disabled={!stepId}
							onClick={async () => {
								if (!stepId) return;
								const step = await q.plugin.timeline.step.duplicate.netSend({
									pluginId,
									timelineId,
									timelineType: "reports",
									stepId,
								});
								navigate(`${step.stepId}`);
							}}
						>
							Duplicate
						</Button>
						<Button
							className="btn-xs btn-error flex-grow"
							disabled={!stepId}
							onClick={async () => {
								if (!stepId) return;
								const { alternateStep } = await q.plugin.timeline.step.delete.netSend({
									pluginId,
									timelineId,
									timelineType: "reports",
									stepId,
								});
								if (alternateStep) {
									navigate(alternateStep);
								} else {
									navigate(`/config/${pluginId}/reports/${timelineId}`);
								}
							}}
						>
							Delete
						</Button>
					</div>
					<Button
						className="btn-outline btn-error w-full"
						disabled={!timelineId}
						onClick={async () => {
							if (
								!timelineId ||
								!(await confirm({
									header: "Are you sure you want to delete this report?",
									body: "All content for this report, including images and other assets, will be gone forever.",
								}))
							)
								return;
							q.plugin.timeline.delete.netSend({
								pluginId,
								timelineId,
								timelineType: "reports",
							});
							navigate(`/config/${pluginId}/reports`);
						}}
					>
						Delete Report
					</Button>
				</div>
				<Outlet />
			</div>
		);
	}
	return <Navigate to={`details`} />;
}
