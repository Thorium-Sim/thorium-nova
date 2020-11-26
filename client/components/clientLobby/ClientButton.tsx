import React from "react";
import {useClientId} from "../../helpers/getClientId";
import {
  useClientQuery,
  useClientSetNameMutation,
} from "client/generated/graphql";
import {usePrompt} from "../Dialog";
import Button from "../ui/button";

export const ClientButton = () => {
  const [clientId] = useClientId();
  const prompt = usePrompt();
  const {data} = useClientQuery();
  const [setName] = useClientSetNameMutation();
  if (!data) return null;
  return (
    <Button
      size="lg"
      variantColor="warning"
      variant="outline"
      onClick={async () => {
        const name = (await prompt({
          header: "What is the new client name?",
          defaultValue: data.client.name,
        })) as string;
        if (name) {
          setName({variables: {id: clientId, name}});
        }
      }}
    >
      Client Name: {data.client.name}
    </Button>
  );
};
