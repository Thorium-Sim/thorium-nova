import type {
	ActionAction,
	ActionState,
} from "@client/components/Config/ActionBuilder";
import { getObject } from "@client/components/Config/EntityQueryBuilder";
import produce from "immer";

export function actionReducer(
	state: ActionState,
	action: ActionAction,
): ActionState {
	let path = "";
	if ("path" in action) {
		path = action.path?.split(".").filter(Boolean).join(".") || "";
	}
	switch (action.type) {
		case "add":
			return produce(state, (draft) => {
				getObject(draft, path || "").push({
					component: "",
					property: "",
					comparison: null,
					value: "",
				});
			});
		case "remove":
			return produce(state, (draft) => {
				path = action.path.split(".").slice(0, -1).filter(Boolean).join(".");
				let index: number | string | undefined = action.path
					.split(".")
					.filter(Boolean)
					.pop();
				index = Number.isNaN(Number(index)) ? index : Number(index);
				getObject(draft, path).splice(index, 1);
			});
		case "component":
			return produce(state, (draft) => {
				getObject(draft, path).component = action.value;
				getObject(draft, path).property = "isPresent";
				getObject(draft, path).comparison = null;
			});

		case "property":
			return produce(state, (draft) => {
				getObject(draft, path).property = action.value;
				getObject(draft, path).comparison = action.comparison;
			});
		case "comparison":
			return produce(state, (draft) => {
				getObject(draft, path).comparison = action.value;
			});
		case "value":
			return produce(state, (draft) => {
				let property = action.path.split(".").filter(Boolean).pop()!;
				path = action.path.split(".").slice(0, -1).filter(Boolean).join(".");
				if (!Number.isNaN(Number(property))) {
					// It's probably trying to set the value of an array
					// We want it to set the value property of the index of the array.
					path += `.${property}`;
					property = "value";
				}
				getObject(draft, path)[property] = action.value;
			});
		case "matchType":
			return produce(state, (draft) => {
				getObject(draft, path).matchType = action.value;
			});
		default:
			return state;
	}
}
