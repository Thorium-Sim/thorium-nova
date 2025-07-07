import {
	ActionInput,
	type ActionAction,
	type ActionState,
} from "@thorium/components/Config/ActionBuilder";
import { q } from "@thorium/context/AppContext";
import Input from "@thorium/ui/Input";

export function TriggerAction({
	action,
	dispatch,
	rename,
	path = "",
	minimal,
}: {
	action?: ActionState;
	dispatch: (input: ActionAction) => void;
	rename?: (name: string) => void;
	path?: string;
	minimal?: boolean;
}) {
	const [availableActions] = q.thorium.actions.useNetRequest();
	if (!action) return null;
	const input = availableActions.find((a) => a.action === action.action)?.input;

	return (
		<>
			{rename ? (
				<div className={minimal ? "" : "mt-4"}>
					<Input
						labelHidden={false}
						label="Action Name"
						placeholder="Advance Timeline"
						defaultValue={action.name}
						onBlur={(e: any) => {
							rename(e.target.value);
						}}
					/>
				</div>
			) : null}
			<div className={minimal ? "" : "mt-4"}>
				{minimal ? null : (
					<h3 className="text-xl font-semibold">Action Inputs</h3>
				)}
				<ActionInput
					action={action}
					dispatch={dispatch}
					input={input}
					path={path}
				/>
				<CustomInputs action={action} dispatch={dispatch} path={path} />
			</div>
		</>
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
		default:
			return <></>;
	}
}
