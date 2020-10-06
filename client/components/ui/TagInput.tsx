import React from "react";
import {useTranslation} from "react-i18next";
import {FaTimes} from "react-icons/fa";
import Badge from "./Badge";
import Input from "./Input";

const Tag: React.FC<{tag: string; onClick: () => void}> = ({tag, onClick}) => {
  return (
    <Badge className="flex items-center mr-2" data-testid="tag-remove">
      {tag}{" "}
      <FaTimes
        className="cursor-pointer rounded-full hover:bg-gray-700 active:bg-gray-800"
        onClick={onClick}
      />
    </Badge>
  );
};
const TagInput: React.FC<{
  label: string;
  tags: string[];
  onRemove: (t: string) => void;
  onAdd: (t: string) => void;
}> = ({tags = [], onRemove, onAdd, label}) => {
  const [tagInput, setTagInput] = React.useState("");
  const {t} = useTranslation();
  return (
    <>
      <div className="flex flex-wrap">
        {tags.map(t => (
          <Tag key={t} tag={t} onClick={() => onRemove(t)} />
        ))}
      </div>

      <Input
        label={label}
        placeholder={t(`Type and press return to add a tag`)}
        value={tagInput}
        onChange={text => setTagInput(text)}
        onBlur={() => {
          if (tagInput) {
            onAdd(tagInput);
            setTagInput("");
          }
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "," || e.key === "." || e.key === "Enter") {
            e.preventDefault();
            if (tagInput) {
              onAdd(tagInput);
              setTagInput("");
            }
          }
          if (e.key === "Tab") {
            if (tagInput) {
              onAdd(tagInput);
              setTagInput("");
            }
          }
          if (
            (e.key === "Backspace" || e.key === "Delete") &&
            tagInput === ""
          ) {
            e.preventDefault();
            onRemove(tags[tags.length - 1]);
          }
        }}
      />
    </>
  );
};

export default TagInput;
