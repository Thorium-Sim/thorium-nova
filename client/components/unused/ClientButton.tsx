import React from "react";
import {Button} from "@chakra-ui/core";
import {useClientId} from "../../helpers/getClientId";
import {usePrompt} from "../Dialog";

const ClientButton = () => {
  const [clientId, setClientId] = useClientId();
  const prompt = usePrompt();
  return (
    <Button
      size="lg"
      variantColor="orange"
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
