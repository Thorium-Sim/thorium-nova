import { Navigate } from "@thorium/components/Navigate";
import { StepButtons, StepList } from "@thorium/components/StepEditor";
import { q } from "@thorium/context/AppContext";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import { href, Link, Outlet, useLocation, useMatch, useNavigate, useParams } from "react-router";

export default function TrainingLayout() {
	const { pathname } = useLocation();

	const { timelineId, pluginId } = useParams() as {
		timelineId: string;
		pluginId: string;
	};

	useMenubar({
		backTo: `/config/${pluginId}/trainings`,
	});

	const navigate = useNavigate();
	const confirm = useConfirm();

	const [item] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
		timelineType: "trainings",
	});

	const match = useMatch("config/:pluginId/trainings/:timelineId/:stepId/*")?.params.stepId;

	const stepId = match === "details" ? undefined : match;

	if (!timelineId || !item) return <Navigate to={`/config/${pluginId}/trainings`} />;

	if (!pathname.endsWith(timelineId)) {
		return (
			<div className="flex h-[calc(100%-2rem)] gap-8 p-8">
				<div className="flex h-full w-72 flex-col">
					<h1 className="mb-2 text-xl font-bold text-white">{item.name}</h1>
					<Link to="details" className={`list-group-item ${match === "details" ? "selected" : ""}`}>
						Training Details
					</Link>
					<hr className="my-2" />
					<StepList
						pluginId={pluginId}
						timelineId={timelineId}
						timelineType="trainings"
						stepId={stepId}
						setStep={(stepId) => {
							navigate(stepId);
						}}
					/>
					<StepButtons
						pluginId={pluginId}
						timelineId={timelineId}
						timelineType="trainings"
						stepId={stepId}
						setStep={(stepId) => {
							if (stepId) {
								navigate(stepId);
							} else {
								navigate(href("/config/:pluginId/trainings/:timelineId", { pluginId, timelineId }));
							}
						}}
					/>
					<Button
						className="btn-outline btn-error w-full"
						disabled={!timelineId}
						onClick={async () => {
							if (
								!timelineId ||
								!(await confirm({
									header: "Are you sure you want to delete this training?",
									body: "All content for this training, including images and other assets, will be gone forever.",
								}))
							)
								return;
							void q.plugin.timeline.delete.netSend({
								pluginId,
								timelineId,
								timelineType: "trainings",
							});
							void navigate(`/config/${pluginId}/trainings`);
						}}
					>
						Delete Training
					</Button>
				</div>
				<Outlet />
			</div>
		);
	}
	return <Navigate to={`details`} />;
}
