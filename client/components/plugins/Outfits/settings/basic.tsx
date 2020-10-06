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
  PluginOutfitSubscription,
  usePluginOutfitSetDescriptionMutation,
  usePluginOutfitSetNameMutation,
  usePluginOutfitSetTagsMutation,
} from "../../../../generated/graphql";
import {useParams} from "react-router";

const OutfitBasic: React.FC<{
  outfit: NonNullable<PluginOutfitSubscription["pluginOutfit"]>;
}> = ({outfit}) => {
  const {t} = useTranslation();
  const {pluginId} = useParams();
  const [setName] = usePluginOutfitSetNameMutation();
  const [setDescription] = usePluginOutfitSetDescriptionMutation();
  const [setTags] = usePluginOutfitSetTagsMutation();
  const [error, setError] = React.useState(false);
  return (
    <Box as="fieldset" key={outfit.id} flex={1} overflowY="auto">
      <Box display="flex" flexWrap="wrap">
        <Box flex={1} pr={4}>
          <FormControl pb={4} isInvalid={error}>
            <FormLabel width="100%">
              {t(`Name`)}
              <Input
                defaultValue={outfit.identity.name}
                onChange={() => setError(false)}
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) =>
                  e.target.value
                    ? setName({
                        variables: {
                          pluginId,
                          outfitId: outfit.id,
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
                defaultValue={outfit.identity.description}
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDescription({
                    variables: {
                      pluginId,
                      outfitId: outfit.id,
                      description: e.target.value,
                    },
                  })
                }
              />
            </FormLabel>
          </FormControl>
          <TagInput
            label={t("Tags")}
            tags={outfit.tags.tags}
            onAdd={tag => {
              if (outfit.tags.tags.includes(tag)) return;
              setTags({
                variables: {
                  pluginId,
                  outfitId: outfit.id,
                  tags: outfit.tags.tags.concat(tag),
                },
              });
            }}
            onRemove={tag => {
              setTags({
                variables: {
                  pluginId,
                  outfitId: outfit.id,
                  tags: outfit.tags.tags.filter(t => t !== tag),
                },
              });
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default OutfitBasic;
