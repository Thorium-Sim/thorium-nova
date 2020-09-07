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
import sleep from "../../helpers/sleep";
import React from "react";
import {FaEdit} from "react-icons/fa";
import {useNavigate, useParams} from "react-router";
import {Link as NavLink} from "react-router-dom";
import SearchableList from "../ui/SearchableList";
import PluginForm from "../ui/PluginForm";
import {} from "../../generated/graphql";
import {useAlert, useConfirm, usePrompt} from "../Dialog";
import {useTranslation} from "react-i18next";

const SystemsList = () => {
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

  const {data} = useUniversesSubscription();
  const [create] = useUniverseCreateMutation();
  const [remove] = useUniverseRemoveMutation();
  const [setName] = useUniverseSetNameMutation();
  const [setDescription] = useUniverseSetDescriptionMutation();
  const [setTags] = useUniverseSetTagsMutation();
  const [setCoverImage] = useUniverseSetCoverImageMutation();

  const alert = useAlert();
  const prompt = usePrompt();
  const confirm = useConfirm();

  async function handleCreate() {
    const name = (await prompt({
      header: t("System Plugin Name"),
      body: t("What is the name of the new system plugin?"),
    })) as string;
    if (!name) return;
    try {
      const data = await create({variables: {name}});
      if (data.errors) {
        await alert({
          header: t("Error Creating System Plugin"),
          body: data.errors[0].message.replace("GraphQL Error:", ""),
        });
        return;
      }
      navigate(`/config/systems/${data.data?.universeCreate.id}`);
    } catch (err) {
      await alert({
        header: t("Error Creating System Plugin"),
        body: err.message.replace("GraphQL Error:", ""),
      });
    }
  }

  const system = data?.systems.find(d => d.id === params.systemId);
  async function handleRemove() {
    if (!system) return;
    if (
      !(await confirm({
        header: t(
          "Are you sure you want to permanently remove this system plugin?"
        ),
        body: t("This will delete all of its objects and assets."),
      }))
    )
      return;
    navigate("/config/universes");
    try {
      const data = await remove({variables: {id: universe.id}});
      if (data.errors) {
        await alert({
          header: t("Error Removing Universe Plugin"),
          body: data.errors[0].message.replace("GraphQL Error:", ""),
        });
        return;
      }
    } catch (err) {
      await alert({
        header: t("Error Removing Universe Plugin"),
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
              <ModalHeader fontSize="4xl">{t(`Universe Plugins`)}</ModalHeader>
              <ModalCloseButton onClick={onClose} />
              <Grid
                templateColumns="1fr 2fr"
                templateRows="1fr auto"
                height="100%"
                px={4}
                gap={4}
                flex={1}
              >
                <Box display="flex" flexDir="column">
                  <SearchableList
                    items={data?.universes || []}
                    searchKeys={["name", "author", "tags"]}
                    selectedItem={params.universeId}
                    setSelectedItem={id => navigate(`/config/universes/${id}`)}
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
                <Box display="flex" flexDir="column">
                  <PluginForm
                    plugin={universe}
                    setName={setName}
                    setDescription={setDescription}
                    setTags={setTags}
                    setCoverImage={setCoverImage}
                  ></PluginForm>
                </Box>
                <ButtonGroup>
                  {/* <Button
                    width="100%"
                    variantColor="info"
                    onClick={handleCreate}
                                        mt={2}

                  >
                    {t(`Import Universe Plugin`)}
                  </Button> */}
                  <Button
                    width="100%"
                    variantColor="success"
                    onClick={handleCreate}
                  >
                    {t(`Create Universe Plugin`)}
                  </Button>
                </ButtonGroup>
                <ButtonGroup>
                  {/* <Button variantColor="info">{t(`Export`)}</Button> */}
                  <Button
                    variantColor="danger"
                    {...{disabled: !universe}}
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

export default SystemsList;
