import {q} from "@client/context/AppContext";
import type {DragEndEvent} from "@dnd-kit/core";
import {useConfirm, usePrompt} from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import {SortableList} from "@thorium/ui/SortableItem";
import {
  Link,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
} from "@remix-run/react";
import {Navigate} from "@client/components/Navigate";

export default function TimelineLayout() {
  const {pathname} = useLocation();

  const {timelineId, pluginId} = useParams() as {
    timelineId: string;
    pluginId: string;
  };

  const navigate = useNavigate();
  const confirm = useConfirm();
  const prompt = usePrompt();

  const [item] = q.plugin.timeline.get.useNetRequest({
    pluginId,
    timelineId,
  });

  const match = useMatch("config/:pluginId/timelines/:timelineId/:stepId/*")
    ?.params.stepId;

  const stepId = match === "details" ? undefined : match;

  if (!timelineId || !item)
    return <Navigate to={`/config/${pluginId}/timelines`} />;

  const steps = item.steps.map(s => ({id: s.id, children: s.name}));

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
      stepId: active.id as string,
      newIndex: Number(overIndex),
    });
    if (result) {
      navigate(result.stepId);
    }
  }

  if (!pathname.endsWith(timelineId)) {
    return (
      <>
        <div className="h-full w-72 flex flex-col">
          <Link
            to="details"
            className={`list-group-item ${
              match === "details" ? "selected" : ""
            }`}
          >
            Timeline Details
          </Link>
          <hr className="my-2" />
          <SortableList
            items={steps}
            onDragEnd={handleDragEnd}
            selectedItem={stepId}
            className="mb-2"
          />
          <div className="flex mb-2">
            <Button
              className="flex-grow btn-xs btn-success"
              onClick={async () => {
                const name = await prompt("What is the new step name?");
                if (!name) return;
                const step = await q.plugin.timeline.step.add.netSend({
                  pluginId,
                  timelineId,
                  name,
                });
                navigate(`${step.stepId}`);
              }}
            >
              Add Step
            </Button>
            <Button
              className="flex-grow btn-xs btn-warning"
              disabled={!stepId}
              onClick={async () => {
                const name = await prompt("What is the new step name?");
                if (!name || !stepId) return;
                const step = await q.plugin.timeline.step.insert.netSend({
                  pluginId,
                  timelineId,
                  stepId,
                  name,
                });
                navigate(`${step.stepId}`);
              }}
            >
              Insert Step
            </Button>
            <Button
              className="flex-grow btn-xs btn-info"
              disabled={!stepId}
              onClick={async () => {
                if (!stepId) return;
                const step = await q.plugin.timeline.step.duplicate.netSend({
                  pluginId,
                  timelineId,
                  stepId,
                });
                navigate(`${step.stepId}`);
              }}
            >
              Duplicate
            </Button>
            <Button
              className="flex-grow btn-xs btn-error"
              disabled={!stepId}
              onClick={async () => {
                if (!stepId) return;
                const {alternateStep} =
                  await q.plugin.timeline.step.delete.netSend({
                    pluginId,
                    timelineId,
                    stepId,
                  });
                if (alternateStep) {
                  navigate(alternateStep);
                } else {
                  navigate(`/config/${pluginId}/timelines/${timelineId}`);
                }
              }}
            >
              Delete
            </Button>
          </div>
          <Button
            className="w-full btn-outline btn-error"
            disabled={!timelineId}
            onClick={async () => {
              if (
                !timelineId ||
                !(await confirm({
                  header: "Are you sure you want to delete this timeline?",
                  body: "All content for this timeline, including images and other assets, will be gone forever.",
                }))
              )
                return;
              q.plugin.timeline.delete.netSend({
                pluginId,
                timelineId,
              });
              navigate(`/config/${pluginId}/timelines`);
            }}
          >
            Delete Timeline
          </Button>
        </div>
        <Outlet />
      </>
    );
  }
  return <Navigate to={`details`} />;
}
