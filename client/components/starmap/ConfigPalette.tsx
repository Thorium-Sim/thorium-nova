import {FormControl, FormLabel, Input, Textarea} from "@chakra-ui/core";
import {
  useUniverseStarSetNameMutation,
  useUniverseStarSetDescriptionMutation,
} from "../../generated/graphql";
import React from "react";
import PropertyPalette from "../ui/propertyPalette";
import {configStoreApi, useConfigStore} from "./configStore";
import {useParams} from "react-router";
import throttle from "lodash.throttle";

const ConfigPalette: React.FC = () => {
  const {universeId} = useParams();
  const selectedObject = useConfigStore(store => store.selectedObject);
  const [setName] = useUniverseStarSetNameMutation();
  const [setDescription] = useUniverseStarSetDescriptionMutation();
  const starId = selectedObject?.id;
  const updateName = React.useMemo(
    () =>
      throttle((name: string) => {
        if (!starId || !universeId) return;
        setName({
          variables: {id: universeId, starId, name},
        });
      }, 500),
    [starId]
  );
  const updateDescription = React.useMemo(
    () =>
      throttle((description: string) => {
        if (!starId || !universeId) return;
        setDescription({
          variables: {id: universeId, starId, description},
        });
      }, 500),
    [starId]
  );
  console.log(selectedObject);
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
    </PropertyPalette>
  );
};

export default ConfigPalette;
