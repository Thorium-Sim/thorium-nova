import React from "react";
import {FaTimes} from "react-icons/fa";
import Button from "./Button";

const Tag: React.FC<{tag: string; onClick: () => void}> = ({tag, onClick}) => {
  return (
    <Button className="badge" data-testid="tag-remove">
      {tag}{" "}
      <FaTimes
        className="cursor-pointer rounded-full hover:bg-gray-700 active:bg-gray-800"
        onClick={onClick}
      />
    </Button>
  );
};
const TagInput: React.FC<{
  label: string;
  tags: string[];
  onRemove: (t: string) => void;
  onAdd: (t: string) => void;
}> = ({tags = [], onRemove, onAdd, label}) => {
  const [tagInput, setTagInput] = React.useState("");
  return (
    <>
      <div className="flex flex-wrap">
        {tags.map(t => (
          <Tag key={t} tag={t} onClick={() => onRemove(t)} />
        ))}
      </div>
      <div className="form-control">
        <label className="label">{label}</label>
        <input
          className="input"
          placeholder="Type and press return to add a tag"
          value={tagInput}
          onChange={e => setTagInput(e.currentTarget.value)}
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
      </div>
    </>
  );
};

export default TagInput;
