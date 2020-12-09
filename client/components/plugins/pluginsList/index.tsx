import React from "react";
import {FaEdit} from "react-icons/fa";
import {useNavigate, useParams} from "react-router";
import {Link as NavLink} from "react-router-dom";
import SearchableList from "../../ui/SearchableList";
import PluginForm from "../../ui/PluginForm";
import {
  usePluginCreateMutation,
  usePluginRemoveMutation,
  usePluginSetCoverImageMutation,
  usePluginSetDescriptionMutation,
  usePluginSetNameMutation,
  usePluginSetTagsMutation,
  usePluginsSubscription,
} from "../../../generated/graphql";
import {useAlert, useConfirm, usePrompt} from "../../Dialog";
import {useTranslation} from "react-i18next";
import {css} from "@emotion/core";
import Button from "../../../components/ui/button";
import ConfigLayout from "../../../components/ui/ConfigLayout";

const PluginList = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const params = useParams();

  const {data} = usePluginsSubscription();
  const [create] = usePluginCreateMutation();
  const [remove] = usePluginRemoveMutation();
  const [setName] = usePluginSetNameMutation();
  const [setDescription] = usePluginSetDescriptionMutation();
  const [setTags] = usePluginSetTagsMutation();
  const [setCoverImage] = usePluginSetCoverImageMutation();

  const alert = useAlert();
  const prompt = usePrompt();
  const confirm = useConfirm();

  async function handleCreate() {
    const name = (await prompt({
      header: t("Plugin Name"),
      body: t("What is the name of the new plugin?"),
    })) as string;
    if (!name) return;
    try {
      const data = await create({variables: {name}});
      if (data.errors) {
        await alert({
          header: t("Error Creating Plugin"),
          body: data.errors[0].message.replace("GraphQL Error:", ""),
        });
        return;
      }
      navigate(`/config/${data.data?.pluginCreate.id}`);
    } catch (err) {
      await alert({
        header: t("Error Creating Plugin"),
        body: err.message.replace("GraphQL Error:", ""),
      });
    }
  }

  const plugin = data?.plugins.find(d => d.id === params.pluginId);
  async function handleRemove() {
    if (!plugin) return;
    if (
      !(await confirm({
        header: t("Are you sure you want to permanently remove this plugin?"),
        body: t("This will delete all of its objects and assets."),
      }))
    )
      return;
    navigate("/config/");
    try {
      const data = await remove({variables: {id: plugin.id}});
      if (data.errors) {
        await alert({
          header: t("Error Removing Plugin"),
          body: data.errors[0].message.replace("GraphQL Error:", ""),
        });
        return;
      }
    } catch (err) {
      await alert({
        header: t("Error Removing Plugin"),
        body: err.message.replace("GraphQL Error:", ""),
      });
    }
  }
  return (
    <ConfigLayout title={t(`Plugins`)}>
      <div
        className="grid h-0 px-4 gap-12 flex-1"
        css={css`
          grid-template-columns: 1fr 2fr;
          grid-template-rows: 1fr auto;
        `}
      >
        <div className="flex flex-col">
          <SearchableList
            items={data?.plugins || []}
            searchKeys={["name", "author", "tags"]}
            selectedItem={params.pluginId}
            setSelectedItem={id => navigate(`/config/${id}`)}
            renderItem={c => (
              <div className="flex justify-between items-center" key={c.id}>
                <div>
                  {c.name}
                  <div>
                    <small>{c.author}</small>
                  </div>
                </div>
                <Button
                  as={NavLink}
                  {...{to: `/config/${c.id}/edit`}}
                  onClick={e => e.stopPropagation()}
                  variant="outline"
                  size="sm"
                  className="text-gray-800"
                >
                  <FaEdit />
                </Button>
              </div>
            )}
          />
        </div>
        <PluginForm
          plugin={plugin}
          setName={setName}
          setDescription={setDescription}
          setTags={setTags}
          setCoverImage={setCoverImage}
        ></PluginForm>
        {/* <Button
                    width="100%"
                    variantColor="info"
                    onClick={handleCreate}
                                        mt={2}

                  >
                    {t(`Import Plugin`)}
                  </Button> */}
        <Button
          className="w-full"
          variantColor="success"
          onClick={handleCreate}
        >
          {t(`Create Plugin`)}
        </Button>
        {plugin && (
          <div className="space-x-4">
            {/* <Button variantColor="info">{t(`Export`)}</Button> */}
            <Button
              as={NavLink}
              {...{
                to: `/config/${plugin?.id}/edit`,
              }}
              variantColor="info"
            >
              {t(`Edit Plugin`)}
            </Button>
            <Button variantColor="danger" onClick={handleRemove}>
              {t(`Remove`)}
            </Button>
          </div>
        )}
      </div>
    </ConfigLayout>
  );
};

export default PluginList;
