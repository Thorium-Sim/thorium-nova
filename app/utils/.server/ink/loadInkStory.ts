import path from "node:path";

import { thoriumContext } from "@thorium/utils/.server/context";
import { Compiler } from "inkjs/full";

export async function loadInkStory(
	inkFilePath: string,
	state?: any,
	variables?: Record<string, any>,
) {
	try {
		const assetUrl = thoriumContext.getStore()!.thoriumPath;
		const inkText = await thoriumContext.getStore()?.readAsset(path.join(assetUrl, inkFilePath));
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
		throw new Error(
			`Unable to read ink story ${inkFilePath}: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
		);
	}
}
