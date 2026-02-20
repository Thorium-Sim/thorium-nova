import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import React, { useImperativeHandle, useEffect, useRef, useState } from "react";
import type * as monaco from "monaco-editor";
import type { editor, languages } from "monaco-editor";

function noop() {}

if (typeof window !== "undefined") {
	window.MonacoEnvironment = {
		getWorker(_: any, label: string) {
			if (label === "css") {
				return new cssWorker();
			}
			return new editorWorker();
		},
	};
}

export type IMonacoEditor = typeof monaco;
export interface MonacoEditorProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
	/**
	 * width of editor.
	 * Defaults to `100%`
	 */
	width?: number | string;
	/**
	 * height of editor.
	 * Defaults to `100%`.
	 */
	height?: number | string;
	/**
	 * value of the auto created model in the editor.
	 */
	value?: string;
	/**
	 * the initial value of the auto created model in the editor.
	 */
	defaultValue?: string;
	/**
	 * The initial language of the auto created model in the editor.
	 * To not create automatically a model, use `model: null`.
	 */
	language?: monaco.editor.IStandaloneEditorConstructionOptions["language"];
	/**
	 * User provided extension function provider for auto-complete.
	 */
	autoComplete?: (
		model: monaco.editor.ITextModel,
		position: monaco.Position,
	) => languages.CompletionItem[];
	/**
	 * Initial theme to be used for rendering.
	 * The current out-of-the-box available themes are: 'vs' (default), 'vs-dark', 'hc-black'.
	 * You can create custom themes via `monaco.editor.defineTheme`.
	 * To switch a theme, use `monaco.editor.setTheme`
	 */
	theme?: monaco.editor.IStandaloneEditorConstructionOptions["theme"];
	/**
	 * The options to create an editor.
	 */
	options?: monaco.editor.IStandaloneEditorConstructionOptions;
	/**
	 * an event emitted when the editor has been mounted (similar to `componentDidMount` of React)
	 */
	editorDidMount?: (
		editor: monaco.editor.IStandaloneCodeEditor,
		monaco: IMonacoEditor,
	) => void;
	/**
	 * an event emitted when the content of the current model has changed.
	 */
	onChange?: (
		value: string,
		event: monaco.editor.IModelContentChangedEvent,
	) => void;
}

export interface RefEditorInstance {
	container: HTMLDivElement | null;
	editor?: monaco.editor.IStandaloneCodeEditor;
	monaco: IMonacoEditor;
}

export const Editor = React.forwardRef<RefEditorInstance, MonacoEditorProps>(
	function Editor(
		{
			width = "100%",
			height = "100%",
			value = "",
			theme = "",
			language = "javascript",
			autoComplete,
			options = {},
			editorDidMount = noop,
			onChange = noop,
			defaultValue = "",
			...other
		},
		ref,
	) {
		const [monaco, setMonaco] = useState<any>(null!);

		useEffect(() => {
			import("monaco-editor").then((monaco) => {
				setMonaco(monaco);
			});
		}, []);
		options.language = language || options.language;
		options.theme = theme || options.theme;
		options.tabSize = 2;

		const container = useRef<HTMLDivElement>(null);
		const editor = useRef<monaco.editor.IStandaloneCodeEditor>(null!);

		const [val, setVal] = useState(defaultValue);

		useImperativeHandle(ref, () => ({
			container: container.current,
			editor: editor.current,
			monaco,
		}));

		// biome-ignore lint/correctness/useExhaustiveDependencies: Way too complicated
		useEffect(() => {
			if (monaco && container.current && !editor.current) {
				editor.current = monaco.editor.create(container.current, {
					value: val,
					...options,
				});
				if (options.theme) {
					monaco.editor.setTheme(options.theme);
				}
				editorDidMount?.(editor.current!, monaco);
				editor.current?.onDidChangeModelContent((event) => {
					const valueCurrent = editor.current!.getValue();
					// Always refer to the latest value
					onChange?.(valueCurrent, event);
				});
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [monaco]);

		useEffect(() => {
			if (monaco && editor.current) {
				const model = editor.current.getModel();
				if (model) {
					monaco.editor.setModelLanguage(model, options.language || "");
				}
			}
		}, [monaco, options.language]);

		useEffect(() => {
			if (editor.current) {
				const optionsRaw = editor.current.getRawOptions();
				(Object.keys(optionsRaw) as (keyof editor.IEditorOptions)[]).forEach(
					(keyname) => {
						const propsOpt = options[keyname];
						if (optionsRaw[keyname] !== propsOpt && propsOpt !== undefined) {
							editor.current!.updateOptions({ [keyname]: propsOpt });
						}
					},
				);
			}
		}, [options]);

		return (
			<div
				{...other}
				ref={container}
				style={{ ...other.style, width, height }}
			/>
		);
	},
);
