import TagInput from "../../../../components/ui/TagInput";
import React from "react";
import {useTranslation} from "react-i18next";
import {
  usePluginShipBasicSubscription,
  usePluginShipSetDescriptionMutation,
  usePluginShipSetNameMutation,
  usePluginShipSetTagsMutation,
  usePluginShipSetCategoryMutation,
} from "../../../../generated/graphql";
import {useParams} from "react-router";
import Input from "client/components/ui/Input";

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

  const ship = data?.pluginShip;

  if (!ship) return <div>Loading...</div>;
  return (
    <fieldset key={shipId} className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap">
        <div className="flex-1 pr-4">
          <div className="pb-4">
            <Input
              labelHidden={false}
              isInvalid={error}
              invalidMessage={t("Class is required")}
              label={t(`Ship Class`)}
              placeholder="Galaxy"
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
                defaultValue={ship.isShip?.category}
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
