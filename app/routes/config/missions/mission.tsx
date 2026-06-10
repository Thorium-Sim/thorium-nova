import { Navigate } from "@thorium/components/Navigate";
import { StepButtons, StepList } from "@thorium/components/StepEditor";
import { q } from "@thorium/context/AppContext";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import { href, Link, Outlet, useLocation, useMatch, useNavigate, useParams } from "react-router";

export default function MissionLayout() {
	const { pathname } = useLocation();

	const { timelineId, pluginId } = useParams() as {
		timelineId: string;
		pluginId: string;
	};

	useMenubar({
		backTo: `/config/${pluginId}/missions`,
	});

	const navigate = useNavigate();
	const confirm = useConfirm();

	const [item] = q.plugin.timeline.get.useNetRequest({
		pluginId,
		timelineId,
		timelineType: "missions",
	});

	const match = useMatch("config/:pluginId/missions/:timelineId/:stepId/*")?.params.stepId;

	const stepId = !match || ["details", "conversations"].includes(match) ? undefined : match;

	if (!timelineId || !item) return <Navigate to={`/config/${pluginId}/missions`} />;

	if (!pathname.endsWith(timelineId)) {
		return (
			<div className="flex h-[calc(100%-2rem)] gap-8 p-8">
				<div className="flex h-full w-72 flex-col">
					<h1 className="mb-2 text-xl font-bold text-white">{item.name}</h1>
					<Link to="details" className={`list-group-item ${match === "details" ? "selected" : ""}`}>
						Mission Details
					</Link>
					<Link
						to="conversations"
						className={`list-group-item ${match === "conversations" ? "selected" : ""}`}
					>
						Conversations
					</Link>
					<hr className="my-2" />
					<StepList
						pluginId={pluginId}
						timelineId={timelineId}
						timelineType="missions"
						stepId={stepId}
						setStep={(stepId) => {
							navigate(stepId);
						}}
					/>
					<StepButtons
						pluginId={pluginId}
						timelineId={timelineId}
						timelineType="missions"
						stepId={stepId}
						setStep={(stepId) => {
							if (stepId) {
								navigate(stepId);
							} else {
								navigate(href("/config/:pluginId/missions/:timelineId", { pluginId, timelineId }));
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
									header: "Are you sure you want to delete this mission?",
									body: "All content for this mission, including images and other assets, will be gone forever.",
								}))
							)
								return;
							q.plugin.timeline.delete.netSend({
								pluginId,
								timelineId,
								timelineType: "missions",
							});
							navigate(`/config/${pluginId}/missions`);
						}}
					>
						Delete Mission
					</Button>
				</div>
				<Outlet />
			</div>
		);
	}
	return <Navigate to={`details`} />;
}
