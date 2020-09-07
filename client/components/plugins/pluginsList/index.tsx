import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Scale,
} from "@chakra-ui/core";
import sleep from "../../../helpers/sleep";
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

const PluginList = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  React.useEffect(() => {
    setIsOpen(true);
  }, []);
  async function onClose() {
    setIsOpen(false);
    await sleep(250);
    navigate("..");
  }
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
    <>
      {/* @ts-ignore */}
      <Scale in={isOpen}>
        {/* @ts-ignore */}
        {styles => (
          <Modal isOpen={true} size="full" scrollBehavior="inside">
            <ModalOverlay opacity={styles.opacity} zIndex={1500} />
            <ModalContent
              {...styles}
              maxWidth="960px"
              display="flex"
              flexDir="column"
              zIndex={1600}
            >
              <ModalHeader fontSize="4xl">{t(`Plugins`)}</ModalHeader>
              <ModalCloseButton onClick={onClose} />
              <Grid
                templateColumns="1fr 2fr"
                templateRows="1fr auto"
                height="0"
                px={4}
                gap={4}
                flex={1}
              >
                <Box display="flex" flexDir="column">
                  <SearchableList
                    items={data?.plugins || []}
                    searchKeys={["name", "author", "tags"]}
                    selectedItem={params.pluginId}
                    setSelectedItem={id => navigate(`/config/${id}`)}
                    renderItem={c => (
                      <Box
                        key={c.id}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <div>
                          {c.name}
                          <div>
                            <small>{c.author}</small>
                          </div>
                        </div>
                        <Button
                          as={NavLink}
                          {...{to: `/starmap/${c.id}`}}
                          onClick={e => e.stopPropagation()}
                          variant="outline"
                          size="sm"
                        >
                          <FaEdit />
                        </Button>
                      </Box>
                    )}
                  />
                </Box>
                <PluginForm
                  plugin={plugin}
                  setName={setName}
                  setDescription={setDescription}
                  setTags={setTags}
                  setCoverImage={setCoverImage}
                ></PluginForm>
                <ButtonGroup>
                  {/* <Button
                    width="100%"
                    variantColor="info"
                    onClick={handleCreate}
                                        mt={2}

                  >
                    {t(`Import Plugin`)}
                  </Button> */}
                  <Button
                    width="100%"
                    variantColor="success"
                    onClick={handleCreate}
                  >
                    {t(`Create Plugin`)}
                  </Button>
                </ButtonGroup>
                <ButtonGroup>
                  {/* <Button variantColor="info">{t(`Export`)}</Button> */}
                  <Button
                    variantColor="danger"
                    {...{disabled: !plugin}}
                    onClick={handleRemove}
                  >
                    {t(`Remove`)}
                  </Button>
                </ButtonGroup>
              </Grid>
              <ModalFooter>
                <Button variantColor="blue" onClick={onClose}>
                  {t(`Back`)}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </Scale>
    </>
  );
};

export default PluginList;
