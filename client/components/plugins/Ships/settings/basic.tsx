import TagInput from "../../../../components/ui/TagInput";
import React from "react";
import {useTranslation} from "react-i18next";
import {
  usePluginShipBasicSubscription,
  usePluginShipSetDescriptionMutation,
  usePluginShipSetNameMutation,
  usePluginShipSetTagsMutation,
  usePluginShipSetCategoryMutation,
  usePhraseListsSubscription,
  usePluginShipSetNameGeneratorPhraseMutation,
} from "../../../../generated/graphql";
import {useParams} from "react-router";
import Input from "client/components/ui/Input";
import {useId} from "@react-aria/utils";

const ShipBasic: React.FC = () => {
  const {t} = useTranslation();
  const {pluginId, shipId} = useParams();
  const {data} = usePluginShipBasicSubscription({
    variables: {pluginId, shipId},
  });
  const [setName] = usePluginShipSetNameMutation();
  const [setDescription] = usePluginShipSetDescriptionMutation();
  const [setCategory] = usePluginShipSetCategoryMutation();
  const [setTags] = usePluginShipSetTagsMutation();
  const [error, setError] = React.useState(false);

  const phrasesData = usePhraseListsSubscription({variables: {pluginId}});
  const [setNameGenerator] = usePluginShipSetNameGeneratorPhraseMutation();
  const ship = data?.pluginShip;

  let elementId = useId();
  const categorizedPhrases =
    phrasesData.data?.phrases.reduce(
      (prev: {[key: string]: typeof next[]}, next) => {
        prev[next.category] = prev[next.category]
          ? prev[next.category].concat(next)
          : [next];
        return prev;
      },
      {}
    ) || {};

  if (!ship) return <div>Loading...</div>;
  return (
    <fieldset key={shipId} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-4">
            <Input
              labelHidden={false}
              isInvalid={error}
              invalidMessage={t("Name is required")}
              label={t(`Name`)}
              defaultValue={ship.identity.name}
              onChange={() => setError(false)}
              onBlur={(e: any) =>
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
          </div>
          <div className={`flex flex-col w-full pb-4`}>
            {/* TODO: Add an i tooltip explaining that this is created from phrases, along with a link to the phrases config screen. */}
            <label id={elementId}>Generated Name Source Phrase</label>
            <select
              aria-labelledby={elementId}
              value={ship.isShip.nameGeneratorPhrase || "default"}
              className={`w-full transition-all duration-200 outline-none px-4 h-10 rounded bg-whiteAlpha-100 border border-whiteAlpha-200 focus:border-primary-400 focus:shadow-outline`}
              onChange={e =>
                setNameGenerator({
                  variables: {
                    pluginId,
                    shipId,
                    phraseId:
                      e.target.value === "default" ? null : e.target.value,
                  },
                })
              }
            >
              <option value="default">Default</option>
              {Object.entries(categorizedPhrases).map(([key, value]) => {
                return (
                  <optgroup label={key} key={key}>
                    {value.map(opt => (
                      <option value={opt.id} key={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
          <div className="pb-4">
            <label className="w-full">
              <Input
                labelHidden={false}
                label={t(`Description`)}
                defaultValue={ship.identity.description}
                onBlur={(e: any) =>
                  setDescription({
                    variables: {
                      pluginId,
                      shipId,
                      description: e.target.value,
                    },
                  })
                }
              />
            </label>
          </div>
          <div className="pb-4">
            <label className="w-full">
              <Input
                labelHidden={false}
                label={t(`Category`)}
                type="textarea"
                defaultValue={ship.isShip.category}
                onBlur={(e: any) =>
                  setCategory({
                    variables: {
                      pluginId,
                      shipId,
                      category: e.target.value,
                    },
                  })
                }
              />
            </label>
          </div>
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
        </div>
      </div>
    </fieldset>
  );
};

export default ShipBasic;
