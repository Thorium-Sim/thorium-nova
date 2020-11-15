import {
  useFlightStartMutation,
  usePluginsSubscription,
} from "../../generated/graphql";
import React from "react";
import {useTranslation} from "react-i18next";
import ConfigLayout from "../ui/ConfigLayout";
import SearchableList from "../ui/SearchableList";
import Input from "../ui/Input";
import randomWords from "random-words";
import Button from "../ui/button";
import {useNavigate} from "react-router";

const CustomFlight = () => {
  const {t} = useTranslation();
  const {data} = usePluginsSubscription();
  const [[checked], setChecked] = React.useState(() => [new Set<string>()]);
  const [startFlight] = useFlightStartMutation();
  const navigate = useNavigate();
  const [flightName, setFlightName] = React.useState(() =>
    randomWords(3).join("-")
  );
  return (
    <ConfigLayout title={t`Custom Flight`}>
      <div className="flex h-full">
        <div className="flex flex-col flex-1">
          <h3 className="font-bold text-2xl">{t("Flight Name")}</h3>
          <Input
            className="mb-2"
            label={t(`Flight Name`)}
            labelHidden
            value={flightName}
            onChange={e => setFlightName(e)}
          />
          <h3 className="font-bold text-2xl">{t(`Activated Plugins`)}</h3>
          <SearchableList
            selectedItem={null}
            setSelectedItem={id => {
              if (checked.has(id)) {
                checked.delete(id);
              } else {
                checked.add(id);
              }
              setChecked([checked]);
            }}
            items={
              data?.plugins.map(p => ({
                id: p.id,
                label: p.name,
              })) || []
            }
            renderItem={c => (
              <div className="inline-flex items-center" key={c.id}>
                <input
                  type="checkbox"
                  className="form-checkbox text-purple-500"
                  readOnly
                  // onChange={() =>
                  //   setChecked(([checked]) => {
                  //     if (checked.has(c.id)) {
                  //       checked.delete(c.id);
                  //     } else {
                  //       checked.add(c.id);
                  //     }
                  //     return [checked];
                  //   })
                  // }
                  checked={checked.has(c.id)}
                ></input>{" "}
                <span className="ml-2">{c.label}</span>
              </div>
            )}
          ></SearchableList>
        </div>
        {/* TODO: Add ship spawning */}
        <div className="flex-1"></div>
        <div className="flex-1"></div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1"></div>
          <Button
            variantColor="success"
            variant="outline"
            className="text-3xl w-full self-end "
            disabled={checked.size === 0}
            onClick={async () => {
              await startFlight({
                variables: {
                  name: flightName || null,
                  plugins: Array.from(checked),
                },
              });
              navigate("/flight");
            }}
          >
            {t("Start Flight")}
          </Button>
        </div>
      </div>
    </ConfigLayout>
  );
};

export default CustomFlight;
