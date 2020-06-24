import React from "react";
import {equal} from "@wry/equality";

export default function useOperationVariables<TVariables>(
  variablesInput?: TVariables,
) {
  const [variables, setVariables] = React.useState<TVariables | undefined>(
    variablesInput,
  );

  React.useEffect(() => {
    if (!equal(variables, variablesInput)) {
      setVariables(variablesInput);
    }
  }, [variables, variablesInput]);

  return variables;
}
