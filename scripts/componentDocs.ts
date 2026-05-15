// @ts-nocheck
import * as ts from "typescript";

const virtualModuleId = "virtual:ecs-component-docs";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;
const docs: Record<
	string,
	{
		component: string;
		comment: string;
		properties: { name: string; comment: string }[];
	}
> = {};
const componentDocsRegex = /.*app\/ecs-components\/.*\.ts$/;
export function componentDocs() {
	return {
		name: "component-docs",
		resolveId(id: string) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id: string) {
			if (id === resolvedVirtualModuleId) {
				return `export const docs = ${JSON.stringify(docs)}`;
			}
		},
		transform(src: string, id: string) {
			if (componentDocsRegex.test(id)) {
				const sourceFile = ts.createSourceFile(id, src, ts.ScriptTarget.Latest, true);
				let currentExportKeyword = "";
				function visit(node: ts.Node) {
					if (ts.SyntaxKind[node.kind] === "ExportKeyword") {
						const keyword = node.parent.declarationList.declarations[0].name.getText();
						if (keyword) {
							currentExportKeyword = keyword;
							docs[currentExportKeyword] = {
								component: currentExportKeyword,
								comment: node.jsDoc?.[0]?.comment || "",
								properties: [],
							};
						}
					}
					if (ts.SyntaxKind[node.kind] === "PropertyAssignment") {
						const name = node.name.getText() || "";
						if (!docs[currentExportKeyword]) {
							docs[currentExportKeyword] = {
								component: currentExportKeyword,
								comment: "",
								properties: [],
							};
						}
						if (name) {
							docs[currentExportKeyword].properties.push({
								name,
								comment: node.jsDoc?.[0]?.comment || "",
							});
						}
					}
					ts.forEachChild(node, visit);
				}

				visit(sourceFile);

				return null;
			}
		},
	};
}
