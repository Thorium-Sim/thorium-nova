import * as React from "react";
import {useGetStarmapStore} from "../starmapStore";
import Button from "../../ui/Button";
import {useNavigate} from "react-router-dom";
import Input from "@thorium/ui/Input";
import randomWords from "@thorium/random-words";
import debounce from "lodash.debounce";
import {PaletteDisclosure} from "../SolarSystemMap";
import {useSystemIds} from "../useSystemIds";
import {q} from "@client/context/AppContext";
import {Icon} from "@thorium/ui/Icon";

export function BasicDisclosure({
  object,
  type,
}: {
  object: {name: string; description: string; skyboxKey?: string};
  type: "system" | "star" | "planet";
}) {
  const useStarmapStore = useGetStarmapStore();
  const [pluginId, solarSystemId] = useSystemIds();
  const navigate = useNavigate();
  const updateName = React.useMemo(
    () =>
      debounce(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
          const name = event.target.value.trim();
          if (!name) return;
          const body = {
            pluginId,
            solarSystemId,
            name,
          };
          if (type === "system") {
            const result = await q.plugin.starmap.solarSystem.update.netSend(
              body
            );
            navigate(result.solarSystemId);
            useStarmapStore.setState({
              selectedObjectIds: [result.solarSystemId],
            });
          } else if (type === "planet") {
            const result = await q.plugin.starmap.planet.update.netSend({
              ...body,
              planetId: object.name,
            });
            useStarmapStore.setState({selectedObjectIds: [result.name]});
          } else if (type === "star") {
            const result = await q.plugin.starmap.star.update.netSend({
              ...body,
              starId: object.name,
            });
            useStarmapStore.setState({selectedObjectIds: [result.name]});
          }
        },
        1000,
        {trailing: true, leading: false}
      ),
    [pluginId, solarSystemId, navigate, object.name, type, useStarmapStore]
  );

  const skyboxKeyRef = React.useRef<HTMLInputElement>(null);
  return (
    <PaletteDisclosure title="Basic">
      <Input label="Name" defaultValue={object.name} onBlur={updateName} />
      <Input
        label="Description"
        as="textarea"
        defaultValue={object.description}
        onChange={event => {
          const body = {
            pluginId,
            solarSystemId,
            description: event.target.value,
          };
          if (type === "system") {
            q.plugin.starmap.solarSystem.update.netSend(body);
          } else if (type === "planet") {
            q.plugin.starmap.planet.update.netSend({
              ...body,
              planetId: object.name,
            });
          } else if (type === "star") {
            q.plugin.starmap.star.update.netSend({
              ...body,
              starId: object.name,
            });
          }
        }}
      />
      {type === "system" && (
        <div className="flex justify-between">
          <Input
            ref={skyboxKeyRef}
            label="Skybox Key"
            helperText="A string of text used to randomly generate the nebula background
    inside solar systems."
            inputButton={
              <Button
                className="btn-sm btn-outline btn-notice"
                onClick={() => {
                  const string = randomWords(3).join(" ");
                  if (skyboxKeyRef.current) {
                    skyboxKeyRef.current.value = string;
                  }
                  q.plugin.starmap.solarSystem.update.netSend({
                    pluginId,
                    solarSystemId,
                    skyboxKey: string,
                  });
                }}
              >
                <Icon name="repeat-2" width="2rem" />
              </Button>
            }
            defaultValue={object.skyboxKey}
            onBlur={event => {
              q.plugin.starmap.solarSystem.update.netSend({
                pluginId,
                solarSystemId,
                skyboxKey: event.target.value,
              });
            }}
          />
        </div>
      )}
    </PaletteDisclosure>
  );
}
