import path from "node:path";

import { thoriumPath } from "@thorium/utils/.server/appPaths";
import { Compiler } from "inkjs/full";

import { DataStore } from "../db-fs";

export async function loadInkStory(
	inkFilePath: string,
	state?: any,
	variables?: Record<string, any>,
) {
	try {
		const inkText = await DataStore.operations
			.getStore()
			?.readAsset(path.join(thoriumPath, inkFilePath));
		if (!inkText) throw new Error("No ink text at path");
		const story = new Compiler(inkText).Compile();
		if (state) {
			story.state.LoadJson(state);
		} else if (variables) {
			// Set up any variables on the story instance
			for (const varName in variables) {
				try {
					story.variablesState[varName] = variables[varName];
				} catch (error) {
					console.error(
						`Unable to assign variable ${varName}: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
					);
				}
			}
		}

		return story;
	} catch (error) {
		console.log(inkFilePath, error);
		throw new Error(
			`Unable to read ink story ${inkFilePath}: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
		);
	}
}
