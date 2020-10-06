import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Textarea,
} from "@chakra-ui/core";
import TagInput from "../../../../components/ui/TagInput";
import React from "react";
import {useTranslation} from "react-i18next";
import {
  usePluginShipBasicSubscription,
  usePluginShipSetDescriptionMutation,
  usePluginShipSetNameMutation,
  usePluginShipSetTagsMutation,
} from "../../../../generated/graphql";
import {useParams} from "react-router";

const ShipBasic: React.FC = () => {
  const {t} = useTranslation();
  const {pluginId, shipId} = useParams();
  const {data} = usePluginShipBasicSubscription({
    variables: {pluginId, shipId},
  });
  const [setName] = usePluginShipSetNameMutation();
  const [setDescription] = usePluginShipSetDescriptionMutation();
  const [setTags] = usePluginShipSetTagsMutation();
  const [error, setError] = React.useState(false);

  const ship = data?.pluginShip;
  if (!ship) return <div>Loading...</div>;
  return (
    <Box as="fieldset" key={shipId} flex={1} overflowY="auto">
      <Box display="flex" flexWrap="wrap">
        <Box flex={1} pr={4}>
          <FormControl pb={4} isInvalid={error}>
            <FormLabel width="100%">
              {t(`Name`)}
              <Input
                defaultValue={ship.identity.name}
                onChange={() => setError(false)}
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) =>
                  e.target.value
                    ? setName({
                        variables: {
                          pluginId,
                          shipId,
                          name: e.target.value,
                        },
                      })
                    : setError(true)
                }
              />
            </FormLabel>
            <FormErrorMessage>{t(`Name is required`)}</FormErrorMessage>
          </FormControl>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Description`)}
              <Textarea
                defaultValue={ship.identity.description}
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDescription({
                    variables: {
                      pluginId,
                      shipId,
                      description: e.target.value,
                    },
                  })
                }
              />
            </FormLabel>
          </FormControl>
          <TagInput
            label={t(`Tags`)}
            tags={ship.tags.tags}
            onAdd={tag => {
              if (ship.tags.tags.includes(tag)) return;
              setTags({
                variables: {
                  pluginId,
                  shipId,
                  tags: ship.tags.tags.concat(tag),
                },
              });
            }}
            onRemove={tag => {
              setTags({
                variables: {
                  pluginId,
                  shipId,
                  tags: ship.tags.tags.filter(t => t !== tag),
                },
              });
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ShipBasic;
