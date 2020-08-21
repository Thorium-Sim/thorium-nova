import {Button, FormControl, FormLabel, Input, Textarea} from "@chakra-ui/core";
import {
  useUniverseSystemSetNameMutation,
  useUniverseSystemSetDescriptionMutation,
} from "../../generated/graphql";
import React from "react";
import PropertyPalette from "../ui/propertyPalette";
import {configStoreApi, useConfigStore} from "./configStore";
import throttle from "lodash.throttle";
import {Vector3} from "three";
import sleep from "../../helpers/sleep";

const ConfigPalette: React.FC = () => {
  const universeId = useConfigStore(store => store.universeId);
  const setSystemId = useConfigStore(store => store.setSystemId);
  const selectedObject = useConfigStore(store => store.selectedObject);
  const [setName] = useUniverseSystemSetNameMutation();
  const [setDescription] = useUniverseSystemSetDescriptionMutation();
  const systemId = selectedObject?.id;
  const updateName = React.useMemo(
    () =>
      throttle((name: string) => {
        if (!systemId || !universeId) return;
        setName({
          variables: {id: universeId, systemId, name},
        });
      }, 500),
    [systemId]
  );
  const updateDescription = React.useMemo(
    () =>
      throttle((description: string) => {
        if (!systemId || !universeId) return;
        setDescription({
          variables: {id: universeId, systemId, description},
        });
      }, 500),
    [systemId]
  );
  if (!selectedObject) return null;
  return (
    <PropertyPalette
      key={selectedObject.id}
      onClose={() => configStoreApi.setState({selectedObject: null})}
    >
      <FormControl>
        <FormLabel htmlFor="name">Name</FormLabel>
        <Input
          id="name"
          defaultValue={selectedObject.identity.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateName(e.target.value.trim())
          }
        />
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="description">Description</FormLabel>
        <Textarea
          id="description"
          defaultValue={selectedObject.identity.description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateDescription(e.target.value)
          }
        />
      </FormControl>
      {/* TODO: Include Faction here eventually... when we get factions */}
      <Button
        size="sm"
        variant="ghost"
        variantColor="primary"
        mt={2}
        width="100%"
        onClick={async () => {
          setSystemId(selectedObject.id);
        }}
      >
        Enter System
      </Button>
    </PropertyPalette>
  );
};

export default ConfigPalette;
