import { Compiler } from "inkjs/full";
import { DataStore } from "../db-fs";

export async function loadInkStory(
	inkFilePath: string,
	state?: any,
	variables?: Record<string, any>,
) {
	const inkText = await DataStore.operations.getStore()?.readAsset(inkFilePath);
	if (!inkText) throw new Error("Unable to read ink story");
	const story = new Compiler(inkText).Compile();

	if (state) {
		story.state.LoadJson(state);
	} else if (variables) {
		// Set up any variables on the story instance
		for (const varName in variables) {
			story.variablesState[varName] = variables[varName];
		}
	}

	return story;
}
