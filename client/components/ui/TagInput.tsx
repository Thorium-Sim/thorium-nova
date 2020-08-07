import {Badge, Box, Input, PseudoBox} from "@chakra-ui/core";
import React from "react";
import {useTranslation} from "react-i18next";
import {FaTimes} from "react-icons/fa";

const Tag: React.FC<{tag: string; onClick: () => void}> = ({tag, onClick}) => {
  return (
    <Badge display="flex" alignItems="center" mr={2}>
      {tag}{" "}
      <PseudoBox
        as={FaTimes}
        cursor="pointer"
        borderRadius="50%"
        _hover={{bg: "grey.700"}}
        _active={{bg: "grey.800"}}
        onClick={onClick}
      />
    </Badge>
  );
};
const TagInput: React.FC<{
  tags: string[];
  onRemove: (t: string) => void;
  onAdd: (t: string) => void;
}> = ({tags = [], onRemove, onAdd}) => {
  const [tagInput, setTagInput] = React.useState("");
  const {t} = useTranslation();
  return (
    <>
      <Box display="flex" flexWrap="wrap">
        {tags.map(t => (
          <Tag key={t} tag={t} onClick={() => onRemove(t)} />
        ))}
      </Box>

      <Input
        placeholder={t(`Type and press return to add a tag`)}
        value={tagInput}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setTagInput(e.target.value)
        }
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
