import * as React from "react";
import ReactMde, {ChildProps, SaveImageHandler} from "@thorium-sim/react-mde";
import "./MarkdownInput.css";

export default function MarkdownInput({
  saveImage,
  value = "",
  setValue,
  ...props
}: ChildProps["textArea"] & {
  saveImage?: SaveImageHandler;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <ReactMde
      value={value}
      onChange={setValue}
      selectedTab="write"
      onTabChange={() => {}}
      childProps={{
        writeButton: {
          tabIndex: -1,
        },
        textArea: {...props, form: undefined},
      }}
      classes={{
        preview: "prose",
        reactMde: "no-preview",
      }}
      paste={saveImage ? {saveImage} : undefined}
    />
  );
}
