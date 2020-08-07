import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Textarea,
} from "@chakra-ui/core";
import React from "react";
import {useTranslation} from "react-i18next";

const PluginForm: React.FC<{
  plugin?: {id: string; name: string; description: string; tags: string[]};
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
    <Box as="fieldset" disabled={!plugin} key={plugin?.id || ""} flex={1}>
      <FormControl pb={4} isInvalid={error}>
        <FormLabel width="100%">
          {t(`Name`)}
          <Input
            defaultValue={plugin?.name}
            onChange={() => setError(false)}
            onBlur={(e: React.ChangeEvent<HTMLInputElement>) =>
              plugin && e.target.value
                ? setName({variables: {id: plugin.id, name: e.target.value}})
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
          <Input defaultValue={plugin?.tags.join(", ")} />
        </FormLabel>
      </FormControl>
      {children}
    </Box>
  );
};

export default PluginForm;
