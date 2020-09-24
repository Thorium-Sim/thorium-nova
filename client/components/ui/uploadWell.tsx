import React from "react";
import {Box, PseudoBox, PseudoBoxProps, Text} from "@chakra-ui/core";
import {FaFileUpload} from "react-icons/fa";
import {useTranslation} from "react-i18next";

const UploadWell: React.FC<
  Omit<PseudoBoxProps, "onChange"> & {
    disabled?: boolean;
    accept?: string;
    onChange?: (files: FileList) => void;
  }
> = ({children, disabled, accept, onChange = files => {}, ...props}) => {
  const [dragging, setDragging] = React.useState(false);
  const {t} = useTranslation();

  // Drag and drop is hard to test
  /* istanbul ignore next */
  function handleDragEnter(e: React.DragEvent) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const acceptMatch = !accept || e.dataTransfer.items[0].type.match(accept);
    if (e.dataTransfer.items?.length === 1 && acceptMatch) {
      setDragging(true);
      e.dataTransfer.dropEffect = "copy";
    } else {
      setDragging(false);
      e.dataTransfer.dropEffect = "none";
    }
  }
  /* istanbul ignore next */
  function handleDragExit(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }
  /* istanbul ignore next */
  function handleDrop(e: React.DragEvent) {
    const acceptMatch = !accept || e.dataTransfer.items[0].type.match(accept);

    if (disabled || !acceptMatch) return;
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length === 1) {
      onChange(files);
    }
  }
  return (
    <PseudoBox
      {...props}
      as="label"
      height="250px"
      width="250px"
      boxShadow="inset 5px 5px 10px rgba(0,0,0,0.1), inset 10px 10px 10px rgba(0,0,0,0.1), inset -2px -2px 10px rgba(0,0,0,0.1)"
      borderRadius="20px"
      bg={dragging ? "whiteAlpha.50" : "blackAlpha.500"}
      cursor={disabled ? "" : dragging ? "copy" : "pointer"}
      my={4}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragExit}
      onDragEnd={handleDragExit}
      onDrop={handleDrop}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {disabled || children ? (
        children
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          width="100%"
          height="100%"
        >
          <FaFileUpload size="5em" />
          <Text textAlign="center" fontSize="2xl" mt={4}>
            {t(`Click or Drop files here`)}
          </Text>
        </Box>
      )}
      <input
        type="file"
        hidden
        accept={accept}
        multiple={false}
        value={""}
        onChange={e => {
          if (e.target?.files?.length === 1) {
            onChange(e.target.files);
          }
        }}
      />
    </PseudoBox>
  );
};

export default UploadWell;
