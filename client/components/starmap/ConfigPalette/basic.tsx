import React from "react";
import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  Textarea,
} from "@chakra-ui/core";
import {
  useUniverseSystemSetNameMutation,
  useUniverseSystemSetDescriptionMutation,
  useUniverseSystemSetSkyboxMutation,
} from "../../../generated/graphql";
import {useConfigStore} from "../configStore";
import throttle from "lodash.throttle";
import {useTranslation} from "react-i18next";
import randomWords from "random-words";
import {isSystem} from "./utils";

const BasicPalette: React.FC = () => {
  const {t} = useTranslation();
  const universeId = useConfigStore(store => store.universeId);
  const setSystemId = useConfigStore(store => store.setSystemId);
  const selectedObject = useConfigStore(store => store.selectedObject);
  const systemId = useConfigStore(store => store.systemId);
  const [setName] = useUniverseSystemSetNameMutation();
  const [setDescription] = useUniverseSystemSetDescriptionMutation();
  const [setSkyboxKey] = useUniverseSystemSetSkyboxMutation();

  const objectId = selectedObject?.id;
  const updateName = React.useMemo(
    () =>
      throttle((name: string) => {
        if (!objectId || !universeId) return;
        setName({
          variables: {id: universeId, systemId: objectId, name},
        });
      }, 500),
    [objectId]
  );
  const updateDescription = React.useMemo(
    () =>
      throttle((description: string) => {
        if (!objectId || !universeId) return;
        setDescription({
          variables: {id: universeId, systemId: objectId, description},
        });
      }, 500),
    [objectId]
  );

  const skyboxKeyRef = React.useRef<HTMLInputElement>(null);

  if (!selectedObject) return null;
  return (
    <>
      <FormControl>
        <FormLabel htmlFor="name">{t("Name")}</FormLabel>
        <Input
          id="name"
          defaultValue={selectedObject.identity.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateName(e.target.value.trim())
          }
        />
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="description">{t("Description")}</FormLabel>
        <Textarea
          id="description"
          defaultValue={selectedObject.identity.description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateDescription(e.target.value)
          }
        />
      </FormControl>
      {/* TODO: Include Faction here eventually... when we get factions */}
      {isSystem(selectedObject) && !systemId && (
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
      )}
      {isSystem(selectedObject) && systemId && (
        <>
          <FormControl>
            <FormLabel htmlFor="skyboxKey">{t("Skybox Key")}</FormLabel>
            <Flex>
              <Input
                id="skyboxKey"
                flex={1}
                ref={skyboxKeyRef}
                defaultValue={selectedObject.planetarySystem?.skyboxKey}
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSkyboxKey({
                    variables: {
                      id: universeId,
                      systemId,
                      skyboxKey: e.target.value,
                    },
                  })
                }
              />
              <IconButton
                icon="repeat"
                aria-label={t(`Random String`)}
                onClick={() => {
                  const string = randomWords(3).join(" ");
                  if (skyboxKeyRef.current) {
                    skyboxKeyRef.current.value = string;
                  }
                  setSkyboxKey({
                    variables: {
                      id: universeId,
                      systemId,
                      skyboxKey: string,
                    },
                  });
                }}
              ></IconButton>
            </Flex>
            <FormHelperText id="skybox-key-helper-text" width={300}>
              A string of text used to randomly generate the nebula background
              inside solar systems.
            </FormHelperText>
          </FormControl>
        </>
      )}
    </>
  );
};

export default BasicPalette;
