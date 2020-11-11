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
  usePluginShipRemoveMutation,
} from "../../../generated/graphql";
import {useAlert, useConfirm, usePrompt} from "../../../components/Dialog";
import {css} from "@emotion/core";
import Button from "client/components/ui/button";
import {FaTimes} from "react-icons/fa";

const ShipsList: React.FC = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {pluginId} = useParams();
  const match = useMatch("/edit/:pluginId/ships/:shipId/*");
  const {shipId} = match?.params || {};

  const {data} = usePluginShipsSubscription({variables: {pluginId}});
  const [create] = usePluginShipCreateMutation();
  const [remove] = usePluginShipRemoveMutation();
  const prompt = usePrompt();
  const confirm = useConfirm();
  const alert = useAlert();
  return (
    <div className="flex p-8 py-12 h-full flex-col bg-blackAlpha-500">
      <Menubar backLink />
      <h1 className="font-bold text-3xl">{t(`Ships`)}</h1>
      <div
        className="grid flex-1 gap-6 h-full pb-2"
        css={css`
          grid-template-columns: 1fr 1fr 2fr;
        `}
      >
        <div className="flex flex-col">
          <div className="flex-1">
            <SearchableList
              selectedItem={shipId}
              setSelectedItem={item => navigate(`${item}/basic`)}
              items={
                data?.pluginShips.map(o => ({
                  id: o.id,
                  label: o.identity.name,
                  category: o.isShip.category,
                })) || []
              }
              renderItem={c => (
                <div className="flex items-center">
                  <div className="flex-1">{c.label}</div>
                  <Button
                    size="sm"
                    aria-label={t("Remove Ship")}
                    variantColor="danger"
                    onClick={async e => {
                      e.preventDefault();
                      if (
                        await confirm({
                          header: `Are you sure you want to delete ${c.label}?`,
                        })
                      ) {
                        remove({variables: {pluginId, shipId}});
                        navigate(`/edit/${pluginId}/ships`);
                      }
                    }}
                  >
                    <FaTimes />
                  </Button>
                </div>
              )}
            />
          </div>
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
        </div>
        <Outlet />
      </div>
    </div>
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
