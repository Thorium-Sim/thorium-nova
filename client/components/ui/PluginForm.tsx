import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Textarea,
} from "@chakra-ui/core";
import React from "react";
import {useTranslation} from "react-i18next";
import InfoTip from "./infoTip";
import TagInput from "./TagInput";
import UploadWell from "./uploadWell";

const PluginForm: React.FC<{
  plugin?: {
    id: string;
    name: string;
    description: string;
    tags: string[];
    coverImage: string;
  };
  setName: (param: {variables: {id: string; name: string}}) => Promise<any>;
  setDescription: (param: {
    variables: {id: string; description: string};
  }) => Promise<any>;
  setTags: (param: {variables: {id: string; tags: string[]}}) => Promise<any>;
  setCoverImage: (param: {variables: {id: string; image: any}}) => Promise<any>;
}> = ({plugin, setName, setDescription, setTags, setCoverImage, children}) => {
  const {t} = useTranslation();
  const [error, setError] = React.useState(false);
  return (
    <Box
      as="fieldset"
      {...{disabled: !plugin}}
      key={plugin?.id || ""}
      flex={1}
      overflowY="auto"
    >
      <Box display="flex" flexWrap="wrap">
        <Box flex={1} pr={4}>
          <FormControl pb={4} isInvalid={error}>
            <FormLabel width="100%">
              {t(`Name`)}
              <Input
                defaultValue={plugin?.name}
                onChange={() => setError(false)}
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) =>
                  plugin && e.target.value
                    ? setName({
                        variables: {id: plugin.id, name: e.target.value},
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
                defaultValue={plugin?.description}
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) =>
                  plugin &&
                  setDescription({
                    variables: {id: plugin.id, description: e.target.value},
                  })
                }
              />
            </FormLabel>
          </FormControl>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Tags`)}
              <TagInput
                tags={plugin?.tags || []}
                onAdd={tag => {
                  if (plugin?.tags.includes(tag) || !plugin) return;
                  setTags({
                    variables: {id: plugin.id, tags: plugin.tags.concat(tag)},
                  });
                }}
                onRemove={tag => {
                  if (!plugin) return;
                  setTags({
                    variables: {
                      id: plugin.id,
                      tags: plugin.tags.filter(t => t !== tag),
                    },
                  });
                }}
              />
            </FormLabel>
          </FormControl>
        </Box>
        <FormControl pb={4}>
          <FormLabel>
            {t(`Cover Image`)}{" "}
            <InfoTip>{t`Used on the Thorium Plugin Store. Images should be square and at least 1024x1024 in size.`}</InfoTip>
            <UploadWell
              accept="image/*"
              onChange={(files: FileList) => {
                if (!plugin) return;
                setCoverImage({variables: {id: plugin?.id, image: files[0]}});
              }}
            >
              {plugin?.coverImage && (
                <Image
                  src={`${plugin.coverImage}?${new Date().getTime()}`}
                  width="90%"
                  height="90%"
                  objectFit="cover"
                  alt="Cover Image"
                />
              )}
            </UploadWell>
          </FormLabel>
        </FormControl>
      </Box>
    </Box>
  );
};

export default PluginForm;
