import { Editor } from "@monaco-editor/react";
import type { BlockProps } from "@thorium/components/timelineBuilder/BlockInputs";
import debounce from "lodash.debounce";

export function CodeBlock({ code, update }: BlockProps<"Code">) {
	return (
		<div className="w-full">
			<div>Run the code and merge its output with the local variables.</div>
			<Editor
				className="min-h-64 w-full"
				defaultValue={code}
				onChange={debounce((e) => {
					update("code", e);
				})}
				theme="vs-dark"
				language="typescript"
				options={{
					minimap: {
						enabled: false,
					},
				}}
			/>
		</div>
	);
}
