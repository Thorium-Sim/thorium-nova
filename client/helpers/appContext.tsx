import React from "react";
import {ThemeProvider, DarkMode} from "@chakra-ui/core";
import Dialog from "../components/Dialog";

const AppContext: React.FC = ({children}) => {
  return (
    <ThemeProvider>
      <DarkMode>
        <Dialog>{children}</Dialog>
      </DarkMode>
    </ThemeProvider>
  );
};

export default AppContext;
