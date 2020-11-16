import React from "react";

export function useDisclosure() {
  const [isOpen, setOpen] = React.useState(false);
  const onOpen = React.useCallback(() => {
    setOpen(true);
  }, []);
  const onClose = React.useCallback(() => {
    setOpen(false);
  }, []);
  return {isOpen, onOpen, onClose};
}
