import {css} from "@emotion/core";
import React from "react";
import {useTranslation} from "react-i18next";
import InfoTip from "./infoTip";
import Input from "./Input";
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
    <fieldset
      className="flex-1 overflow-y-auto"
      {...{disabled: !plugin}}
      key={plugin?.id || ""}
    >
      <div className="flex flex-wrap gap-12">
        <div className="flex-1 pb-4">
          <Input
            className="pb-4"
            label={t(`Name`)}
            defaultValue={plugin?.name}
            onChange={() => setError(false)}
            onBlur={(e: React.FocusEvent<Element>) => {
              const target = e.target as HTMLInputElement;
              plugin && target.value
                ? setName({
                    variables: {id: plugin.id, name: target.value},
                  })
                : setError(true);
            }}
          />
          <Input
            className="pb-4"
            label={t(`Description`)}
            defaultValue={plugin?.description}
            onChange={() => setError(false)}
            onBlur={(e: React.FocusEvent<Element>) => {
              const target = e.target as HTMLInputElement;
              plugin && target.value
                ? setDescription({
                    variables: {id: plugin.id, description: target.value},
                  })
                : setError(true);
            }}
          />
          <label>{t("Tags")}</label>
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
        </div>
        <div className="pb-4">
          <label>
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
                <img
                  src={`${plugin.coverImage}?${new Date().getTime()}`}
                  css={css`
                    width: 90%;
                    height: 90%auto;
                    object-fit: cover;
                  `}
                  alt="Cover Image"
                />
              )}
            </UploadWell>
          </label>
        </div>
      </div>
    </fieldset>
  );
};

export default PluginForm;
