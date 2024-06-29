import {
	ActionCombobox,
	type ActionState,
	type ActionAction,
} from "@client/components/Config/ActionBuilder";
import { Suspense, useReducer, useState } from "react";
import produce from "immer";
import { SortableList } from "@thorium/ui/SortableItem";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import { Tooltip } from "@thorium/ui/Tooltip";
import { Icon } from "@thorium/ui/Icon";
import type { DragEndEvent } from "@dnd-kit/core";
import { TriggerAction } from "@client/routes/config+/$pluginId.timelines+/$timelineId.$stepId.$actionId/route";
import { actionReducer } from "@client/routes/config+/$pluginId.timelines+/$timelineId.$stepId.$actionId/actionReducer";
import Button from "@thorium/ui/Button";
import { q } from "@client/context/AppContext";
import { ErrorBoundary } from "react-error-boundary";

type ActionsState = (ActionState & { id: string })[];
function actionsReducer(
	state: ActionsState,
	action:
		| (ActionAction & { actionId: string })
		| { type: "addAction"; id: string; action: string; name: string }
		| { type: "removeAction"; actionId: string }
		| { type: "moveAction"; actionId: string; overIndex: number }
		| { type: "clear" },
): ActionsState {
	switch (action.type) {
		case "addAction":
			return [
				...state,
				{
					id: action.id,
					action: action.action,
					name: action.name,
					values: {},
				},
			];
		case "removeAction":
			return state.filter((a) => a.id !== action.actionId);
		case "moveAction": {
			const actionId = action.actionId;
			const actionIndex = state.findIndex((action) => action.id === actionId);
			const updatedActions = produce(state, (draft) => {
				const [movedItem] = draft.splice(actionIndex, 1);
				draft.splice(action.overIndex, 0, movedItem);
			});
			return updatedActions;
		}
		case "clear":
			return [];
		default:
			return state.map((state) => {
				if (state.id !== action.actionId) return state;
				return { ...state, ...actionReducer(state, action) };
			});
	}
}

export function ActionsCore() {
	const [actionsList, dispatch] = useReducer(
		actionsReducer,
		[] as ActionsState,
	);

	const [selectedAction, setSelectedAction] = useState<string | undefined>();

	const actions = actionsList.map((a) => ({
		id: a.id,
		className: "list-group-item-xs subtle",
		children: (
			<div>
				<span className="flex">
					<span className="flex-1">{a.name}</span>
					<Tooltip content="Delete Action">
						<button
							className=""
							aria-label="Delete action"
							onClick={async (e) => {
								e.stopPropagation();
								e.preventDefault();
								dispatch({ type: "removeAction", actionId: a.id });
							}}
						>
							<Icon name="ban" className="text-red-500" />
						</button>
					</Tooltip>
				</span>
				<ErrorBoundary fallback={<>Error in action editor</>}>
					{selectedAction === a.id ? (
						<TriggerAction
							action={a}
							dispatch={(action) => dispatch({ actionId: a.id, ...action })}
							minimal
						/>
					) : null}
				</ErrorBoundary>
			</div>
		),
	}));

	async function handleDragEnd({
		active,
		overIndex,
	}: {
		active: DragEndEvent["active"];
		overIndex: number;
	}) {
		dispatch({ type: "moveAction", actionId: active.id as string, overIndex });
	}

	return (
		<>
			<SortableList
				items={actions}
				onDragEnd={handleDragEnd}
				selectedItem={selectedAction}
				className="mb-1"
				onClick={(item) => setSelectedAction(item)}
			/>
			<Suspense fallback={<LoadingSpinner />}>
				<ActionCombobox
					value={null}
					onChange={async ({ action, name }) => {
						const id = Math.random().toString(36).substring(2, 9);
						dispatch({ type: "addAction", id, action, name });
						setSelectedAction(id);
					}}
					placeholder="Add Action"
				/>
			</Suspense>
			<div className="flex gap-2">
				<Button
					className="flex-1 btn-outline btn-warning btn-xs"
					onClick={() => dispatch({ type: "clear" })}
				>
					Clear
				</Button>
				<Button
					className="flex-1 btn-outline btn-primary btn-xs"
					onClick={async () => {
						await q.thorium.executeActions.netSend({ actions: actionsList });
						dispatch({ type: "clear" });
					}}
				>
					Send
				</Button>
			</div>
		</>
	);
}
