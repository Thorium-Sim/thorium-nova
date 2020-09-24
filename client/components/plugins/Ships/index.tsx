import {Box, Button, ButtonGroup, Flex, Grid, Heading} from "@chakra-ui/core";
import SearchableList from "../../../components/ui/SearchableList";
import React from "react";
import {
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
  useParams,
} from "react-router";
import Menubar from "../Outfits/Menubar";
import {useTranslation} from "react-i18next";
import ShipSettings from "./shipSettings";
import {
  usePluginShipsSubscription,
  usePluginShipCreateMutation,
} from "../../../generated/graphql";
import {useAlert, usePrompt} from "../../../components/Dialog";

const ShipsList: React.FC = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {pluginId} = useParams();
  const match = useMatch("/edit/:pluginId/ships/:shipId/*");
  const {shipId} = match?.params || {};

  const {data} = usePluginShipsSubscription({variables: {pluginId}});
  const [create] = usePluginShipCreateMutation();

  const prompt = usePrompt();
  const alert = useAlert();

  return (
    <Flex p={8} py={12} height="100%" direction="column" bg="blackAlpha.500">
      <Menubar />
      <Heading>{t(`Ships`)}</Heading>
      <Grid flex={1} templateColumns="1fr 1fr 2fr" gap={6} height="100%" pb={2}>
        <Flex direction="column">
          <Box flex={1}>
            <SearchableList
              selectedItem={shipId}
              setSelectedItem={item => navigate(`${item}/basic`)}
              items={
                data?.pluginShips.map(o => ({
                  id: o.id,
                  label: o.identity.name,
                })) || []
              }
            />
          </Box>
          <Button
            onClick={async () => {
              const name = await prompt({
                header: t("What is the name of the new ship?"),
              });
              if (!name || typeof name !== "string") return;
              const response = await create({variables: {name, pluginId}});
              if (response?.errors?.[0].message) {
                await alert({
                  header: t("Error creating ship."),
                  body: response?.errors?.[0].message,
                });
                return;
              }
              navigate(`${response.data?.pluginShipCreate.id}/basic`);
            }}
          >
            {t(`New Ship`)}
          </Button>
        </Flex>
        <Outlet />
      </Grid>
    </Flex>
  );
};

const ShipsConfig = () => {
  return (
    <Routes>
      <Route path="/" element={<ShipsList></ShipsList>}>
        <Route path=":shipId/*" element={<ShipSettings />} />
      </Route>
    </Routes>
  );
};

export default ShipsConfig;
