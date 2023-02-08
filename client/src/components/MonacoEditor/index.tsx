import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import React, {useImperativeHandle, useEffect, useRef, useState} from "react";
import * as monaco from "monaco-editor";
import {editor, languages} from "monaco-editor";
import prettier from "prettier";
import pluginLess from "prettier/parser-postcss";
function noop() {}

self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    return new editorWorker();
  },
};

monaco.languages.css.lessDefaults.setOptions({
  data: {
    dataProviders: {
      tailwind: {
        version: 1.1,
        atDirectives: [
          {
            name: "@tailwind",
            description:
              "Use the `@tailwind` directive to insert Tailwind's `base`, `components`, `utilities` and `screens` styles into your CSS.",
            references: [
              {
                name: "Tailwind Documentation",
                url: "https://tailwindcss.com/docs/functions-and-directives#tailwind",
              },
            ],
          },
          {
            name: "@responsive",
            description:
              "You can generate responsive variants of your own classes by wrapping their definitions in the `@responsive` directive:\n```css\n@responsive {\n  .alert {\n    background-color: #E53E3E;\n  }\n}\n```\n",
            references: [
              {
                name: "Tailwind Documentation",
                url: "https://tailwindcss.com/docs/functions-and-directives#responsive",
              },
            ],
          },
          {
            name: "@screen",
            description:
              "The `@screen` directive allows you to create media queries that reference your breakpoints by **name** instead of duplicating their values in your own CSS:\n```css\n@screen sm {\n  /* ... */\n}\n```\n…gets transformed into this:\n```css\n@media (min-width: 640px) {\n  /* ... */\n}\n```\n",
            references: [
              {
                name: "Tailwind Documentation",
                url: "https://tailwindcss.com/docs/functions-and-directives#screen",
              },
            ],
          },
          {
            name: "@variants",
            description:
              "Generate `hover`, `focus`, `active` and other **variants** of your own utilities by wrapping their definitions in the `@variants` directive:\n```css\n@variants hover, focus {\n   .btn-brand {\n    background-color: #3182CE;\n  }\n}\n```\n",
            references: [
              {
                name: "Tailwind Documentation",
                url: "https://tailwindcss.com/docs/functions-and-directives#variants",
              },
            ],
          },
          {
            name: "@apply",
            description:
              "Inline any existing utility classes into your own custom CSS.",
            references: [
              {
                name: "Tailwind Documentation",
                url: "https://tailwindcss.com/docs/functions-and-directives#apply",
              },
            ],
          },
        ],
      },
    },
  },
});

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
    position: monaco.Position
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
    monaco: IMonacoEditor
  ) => void;
  /**
   * an event emitted when the content of the current model has changed.
   */
  onChange?: (
    value: string,
    event: monaco.editor.IModelContentChangedEvent
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
    ref
  ) {
    options.language = language || options.language;
    options.theme = theme || options.theme;
    options.tabSize = 2;
    const [val, setVal] = useState(defaultValue);
    const container = useRef<HTMLDivElement>(null);
    const editor = useRef<monaco.editor.IStandaloneCodeEditor>();
    useImperativeHandle(ref, () => ({
      container: container.current,
      editor: editor.current,
      monaco,
    }));

    useEffect(() => {
      if (container.current && !editor.current) {
        editor.current = monaco.editor.create(container.current, {
          value: val,
          language,
          ...options,
        });
        if (options.theme) {
          monaco.editor.setTheme(options.theme);
        }
        editorDidMount?.(editor.current, monaco);
        editor.current.onDidChangeModelContent(event => {
          const valueCurrent = editor.current!.getValue();
          // Always refer to the latest value
          onChange?.(valueCurrent, event);
        });
        editor.current.addCommand(
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
          function () {
            const formatted = prettier.format(editor.current!.getValue(), {
              parser: "less",
              plugins: [pluginLess],
            });
            setVal(formatted);
            if (editor.current) {
              editor.current.setValue(formatted);
            }
          }
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (editor.current) {
        const model = editor.current.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, options.language || "");
        }
      }
    }, [options.language]);

    useEffect(() => {
      if (editor.current) {
        const optionsRaw = editor.current.getRawOptions();
        (Object.keys(optionsRaw) as (keyof editor.IEditorOptions)[]).forEach(
          keyname => {
            const propsOpt = options[keyname];
            if (optionsRaw[keyname] !== propsOpt && propsOpt !== undefined) {
              editor.current!.updateOptions({[keyname]: propsOpt});
            }
          }
        );
      }
    }, [options]);

    return (
      <div {...other} ref={container} style={{...other.style, width, height}} />
    );
  }
);
