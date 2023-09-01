import {
  ActionAction,
  ActionInput,
  ActionState,
} from "@client/components/Config/ActionBuilder";
import {q} from "@client/context/AppContext";
import {toast} from "@client/context/ToastContext";
import Input from "@thorium/ui/Input";
import Modal from "@thorium/ui/Modal";
import {Link, Navigate, useNavigate, useParams} from "react-router-dom";
import {actionReducer} from "./actionReducer";
import Select from "@thorium/ui/Select";
import {capitalCase} from "change-case";
import {Tooltip} from "@thorium/ui/Tooltip";
import {FaBan} from "react-icons/fa";
import {useState} from "react";
import {cn} from "@client/utils/cn";
import {ComponentQuery} from "@server/classes/Plugins/Timeline";
import {
  EntityQueryBuilder,
  queryReducer,
} from "@client/components/Config/EntityQueryBuilder";
import InfoTip from "@thorium/ui/InfoTip";

export function TimelineAction() {
  const navigate = useNavigate();
  const [availableActions] = q.thorium.actions.useNetRequest();

  const {pluginId, timelineId, stepId, actionId} = useParams() as {
    pluginId: string;
    timelineId: string;
    stepId: string;
    actionId: string;
  };
  const [timeline] = q.plugin.timeline.get.useNetRequest({
    pluginId,
    timelineId,
  });
  const step = timeline.steps.find(s => s.id === stepId);
  const action = step?.actions.find(a => a.id === actionId);

  async function dispatch(input: ActionAction) {
    if (!action) return;
    const newState = actionReducer(action, input);
    try {
      await q.plugin.timeline.step.action.update.netSend({
        pluginId,
        timelineId,
        stepId,
        actionId,
        values: newState.values,
      });
    } catch (err) {
      if (err instanceof Error) {
        toast({
          title: "Error updating action",
          body: err.message,
          color: "error",
        });
      }
    }
  }
  if (!action)
    return (
      <Navigate to={`/config/${pluginId}/timelines/${timelineId}/${stepId}`} />
    );

  const input = availableActions.find(a => a.action === action.action)?.input;

  return (
    <Modal
      isOpen
      setIsOpen={() => navigate("..")}
      title="Action Details"
      panelClassName="min-w-[20rem]"
    >
      <div className="mt-4">
        <Input
          labelHidden={false}
          label="Action Name"
          placeholder="Advance Timeline"
          defaultValue={action.name}
          onBlur={async (e: any) => {
            try {
              await q.plugin.timeline.step.action.update.netSend({
                pluginId,
                timelineId,
                stepId,
                actionId,
                name: e.target.value,
              });
            } catch (err) {
              if (err instanceof Error) {
                toast({
                  title: "Error renaming action",
                  body: err.message,
                  color: "error",
                });
              }
            }
          }}
        />
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-semibold">Action Inputs</h3>
        <ActionInput
          action={action}
          dispatch={dispatch}
          input={input}
          path=""
        />
        <CustomInputs action={action} dispatch={dispatch} path="" />
      </div>
    </Modal>
  );
}

function CustomInputs({
  action,
  dispatch,
  path,
}: {
  action: ActionState;
  dispatch: (input: ActionAction) => void;
  path: string;
}) {
  switch (action.action) {
    case "triggers.create":
      return <TriggerInput action={action} dispatch={dispatch} path={path} />;
    default:
      return <></>;
  }
}

function TriggerInput({
  action,
  dispatch,
  path,
}: {
  action: ActionState;
  dispatch: (input: ActionAction) => void;
  path: string;
}) {
  const [selectedCondition, setSelectedCondition] = useState<null | number>(0);
  // @ts-expect-error Things get messy here
  const condition = action.values?.conditions?.[selectedCondition ?? -1];
  return (
    <>
      <div className="w-[80vw] min-h-[30vh] max-h-[40vh] flex gap-4 mt-4 divide-x">
        <div className="flex-1 flex flex-col">
          <p className="font-bold text-center">Conditions</p>
          <div className="relative overflow-y-auto overflow-x-hidden flex-1">
            <ul className="relative">
              {/* @ts-expect-error Bad types */}
              {action.values?.conditions?.map(
                (condition: any, index: number) => (
                  <li
                    key={index}
                    className={cn(
                      "list-group-item px-4 py-2 touch-none !flex items-center",
                      {selected: selectedCondition === index}
                    )}
                    onClick={() => setSelectedCondition(index)}
                  >
                    <span className="flex-1">
                      {capitalCase(condition.type)}
                    </span>
                    <Tooltip content="Delete Action" className="w-min mr-4">
                      <button
                        className=""
                        aria-label="Delete action"
                        onClick={async e => {
                          e.stopPropagation();
                          e.preventDefault();

                          dispatch({
                            type: "value",
                            path: `${path}.values.conditions`,
                            // @ts-expect-error Things get messy here
                            value: (action.values.conditions || []).filter(
                              // @ts-expect-error Things get messy here
                              (_, i) => i !== index
                            ),
                          });
                        }}
                      >
                        <FaBan className="text-red-500" />
                      </button>
                    </Tooltip>
                  </li>
                )
              )}
            </ul>
          </div>
          <Select
            size="xs"
            label="Add Condition"
            labelHidden
            items={[
              {id: "entityMatch", label: "Entity Match"},
              {id: "distance", label: "Distance"},
              {id: "eventListener", label: "Event Listener"},
            ]}
            selected={null}
            setSelected={value =>
              dispatch({
                type: "value",
                path: `${path}.values.conditions`,
                // @ts-expect-error Things get messy here
                value: [...action.values.conditions, {type: value.id}],
              })
            }
            placeholder="Add Condition"
          ></Select>
        </div>
        <div className="flex-1">
          <p className="font-bold text-center">Actions</p>
        </div>
      </div>
      <Modal
        isOpen={selectedCondition !== null}
        setIsOpen={() => setSelectedCondition(null)}
        title="Condition"
        panelClassName="min-w-[30rem]"
      >
        <div className="mt-4">
          <TriggerCondition
            condition={condition}
            dispatch={dispatch}
            index={selectedCondition}
          />
        </div>
      </Modal>
    </>
  );
}

function TriggerCondition({
  condition,
  dispatch,
  index,
}: {
  condition:
    | {type: "entityMatch"; query: ComponentQuery[]; matchCount: ">1" | string}
    | {
        type: "distance";
        entityA: ComponentQuery[];
        entityB: ComponentQuery[];
        distance: number;
        condition: "lessThan" | "greaterThan";
      }
    | {type: "eventListener"; event: string; values?: Record<string, any>};
  dispatch: (input: ActionAction) => void;
  index: number | null;
}) {
  const [events] = q.thorium.events.useNetRequest();

  switch (condition?.type) {
    case "entityMatch": {
      const query = condition.query || [
        {
          component: "",
          property: "",
          comparison: "=",
          value: "",
        },
      ];
      return (
        <>
          <EntityQueryBuilder
            state={query}
            dispatch={action => {
              const newQuery = queryReducer(query, action);
              dispatch({
                type: "value",
                path: `values.conditions.${index}.query`,
                value: newQuery as any,
              });
            }}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                size="xs"
                label="Trigger When Query Matches:"
                items={[
                  {
                    id: "0",
                    label: "0 Entities",
                  },
                  {id: "1", label: "1 Entities"},
                  {id: ">1", label: "> 1 Entities"},
                  {id: "custom", label: "Custom"},
                ]}
                selected={
                  ![null, "0", "1", ">1"].includes(condition.matchCount)
                    ? {id: "custom", label: "Custom"}
                    : condition.matchCount
                    ? {
                        id: condition.matchCount?.toString(),
                        label: `${condition.matchCount?.toString()} Entities`,
                      }
                    : null
                }
                setSelected={value => {
                  dispatch({
                    type: "value",
                    path: `values.conditions.${index}.matchCount`,
                    value: !value
                      ? null!
                      : value.id === "custom"
                      ? "2"
                      : value.id === ">1"
                      ? ">1"
                      : value.id,
                  });
                }}
              />
            </div>
            {![null, "0", "1", ">1"].includes(condition.matchCount) ? (
              <div className="flex-1">
                <Input
                  className="input-sm"
                  label="Custom Match Entity Count"
                  defaultValue={condition.matchCount}
                  key={condition.matchCount}
                  onBlur={event =>
                    dispatch({
                      type: "value",
                      path: `values.conditions.${index}.matchCount`,
                      value: event.target.value ?? "2",
                    })
                  }
                />
              </div>
            ) : null}
          </div>
        </>
      );
    }
    case "distance": {
      const entityA = condition.entityA || [
        {
          component: "",
          property: "",
          comparison: "=",
          value: "",
        },
      ];
      const entityB = condition.entityB || [
        {
          component: "",
          property: "",
          comparison: "=",
          value: "",
        },
      ];
      return (
        <>
          <div>
            <label>Entity A</label>
            <EntityQueryBuilder
              state={entityA}
              dispatch={action => {
                const newQuery = queryReducer(entityA, action);
                dispatch({
                  type: "value",
                  path: `values.conditions.${index}.entityA`,
                  value: newQuery as any,
                });
              }}
            />
          </div>
          <hr className="my-2" />

          <div>
            <label>Entity B</label>
            <EntityQueryBuilder
              state={entityB}
              dispatch={action => {
                const newQuery = queryReducer(entityB, action);
                dispatch({
                  type: "value",
                  path: `values.conditions.${index}.entityB`,
                  value: newQuery as any,
                });
              }}
            />
          </div>
          <hr className="my-2" />
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                size="xs"
                label="Distance Condition"
                items={[
                  {
                    id: "lessThan",
                    label: "Less Than",
                  },
                  {id: "greaterThan", label: "Greater Than"},
                ]}
                selected={
                  condition.condition === "lessThan"
                    ? {id: "lessThan", label: "Less Than"}
                    : condition.condition === "greaterThan"
                    ? {id: "greaterThan", label: "Greater Than"}
                    : null
                }
                setSelected={value => {
                  dispatch({
                    type: "value",
                    path: `values.conditions.${index}.condition`,
                    value: value.id,
                  });
                }}
              />
            </div>
            <div className="flex-1">
              <Input
                className="input-sm"
                label="Distance"
                defaultValue={condition.distance}
                key={condition.distance}
                onBlur={event =>
                  dispatch({
                    type: "value",
                    path: `values.conditions.${index}.distance`,
                    value: event.target.value ?? "2",
                  })
                }
              />
            </div>
          </div>
        </>
      );
    }
    case "eventListener": {
      const mappedEvents = events.map(e => ({
        id: e.event,
        label: e.name,
        input: e.input,
      }));
      const selectedEvent = mappedEvents.find(e => e.id === condition.event);
      return (
        <>
          <Select
            size="xs"
            label="Event"
            items={mappedEvents}
            selected={selectedEvent || null}
            setSelected={value => {
              dispatch({
                type: "value",
                path: `values.conditions.${index}.event`,
                value: value.id,
              });
            }}
          />
          {selectedEvent ? (
            <>
              <label className="mt-2">
                Condition Match{" "}
                <InfoTip>
                  Only trigger when the event arguments match these values.
                </InfoTip>
              </label>

              <ActionInput
                action={{
                  action: selectedEvent.id,
                  name: selectedEvent.label,
                  values: condition.values || {},
                }}
                dispatch={dispatch}
                input={selectedEvent.input}
                path={`values.conditions.${index}`}
              />
            </>
          ) : null}
        </>
      );
    }
    default:
      return null;
  }
}
