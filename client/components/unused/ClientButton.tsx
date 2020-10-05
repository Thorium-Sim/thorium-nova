import React from "react";
import {useClientId} from "../../helpers/getClientId";
import {usePrompt} from "../Dialog";
import Button from "../ui/button";

export const ClientButton = () => {
  const [clientId, setClientId] = useClientId();
  const prompt = usePrompt();
  return (
    <Button
      size="lg"
      variantColor="warning"
      variant="outline"
      onClick={async () => {
        const id = (await prompt({
          header: "What is the new client ID?",
          defaultValue: clientId,
        })) as string;
        if (id) {
          setClientId(id);
        }
      }}
    >
      Client ID: {clientId}
    </Button>
  );
};
