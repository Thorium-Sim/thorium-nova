import Button from "../../ui/Button";
import UploadWell from "@thorium/ui/UploadWell";
import InfoTip from "@thorium/ui/InfoTip";
import PlanetPlugin from "@server/classes/Plugins/Universe/Planet";
import {PaletteDisclosure} from "../SolarSystemMap";
import {useSystemIds} from "../useSystemIds";
import {q} from "@client/context/AppContext";

export function PlanetAssetDisclosure({object}: {object: PlanetPlugin}) {
  const [pluginId, solarSystemId] = useSystemIds();

  return (
    <PaletteDisclosure title="Planet Assets">
      <div>
        <label className="inline-flex items-center">
          Texture{" "}
          <InfoTip>
            Image aspect ratio should be 2x1, with the dimensions as powers of
            two, eg. 512x256 or 2048x1024
          </InfoTip>
        </label>
        <UploadWell
          accept="image/*"
          onChange={(files: FileList) => {
            q.plugin.starmap.planet.update.netSend({
              pluginId,
              solarSystemId,
              planetId: object.name,
              textureMapAsset: files[0],
            });
          }}
        >
          <img
            src={`${object.isPlanet.textureMapAsset}?${new Date().getTime()}`}
            className="w-[90%] h-[90%] object-contain"
            alt="Planet Texture"
          />
        </UploadWell>
      </div>
      <div>
        <label className="inline-flex items-center">
          Clouds{" "}
          <InfoTip>
            Image should be a transparent PNG. The aspect ratio should be 2x1,
            with the dimensions as powers of two, eg. 512x256 or 2048x1024
          </InfoTip>
        </label>
        <UploadWell
          accept="image/*"
          onChange={(files: FileList) => {
            q.plugin.starmap.planet.update.netSend({
              pluginId,
              solarSystemId,
              planetId: object.name,
              cloudMapAsset: files[0],
            });
          }}
        >
          {object.isPlanet.cloudMapAsset && (
            <img
              src={`${object.isPlanet.cloudMapAsset}?${new Date().getTime()}`}
              className="w-[90%] h-[90%] object-contain"
              alt="Clouds Texture"
            />
          )}
        </UploadWell>
        <Button
          className="btn-block btn-xs my-2"
          onClick={() =>
            q.plugin.starmap.planet.update.netSend({
              pluginId,
              solarSystemId,
              planetId: object.name,
              cloudMapAsset: null,
            })
          }
        >
          Remove Clouds
        </Button>
      </div>
      <div>
        <label className="inline-flex items-center">
          Rings{" "}
          <InfoTip>
            Image should be a transparent PNG. Vertical lines in the image
            represent rings.
          </InfoTip>
        </label>
        <UploadWell
          accept="image/*"
          onChange={(files: FileList) => {
            q.plugin.starmap.planet.update.netSend({
              pluginId,
              solarSystemId,
              planetId: object.name,
              ringMapAsset: files[0],
            });
          }}
        >
          {object.isPlanet.ringMapAsset && (
            <img
              src={`${object.isPlanet.ringMapAsset}?${new Date().getTime()}`}
              className="w-[90%] h-[90%] object-contain"
              alt="Clouds Texture"
            />
          )}
        </UploadWell>
        <Button
          className="btn-block btn-xs my-2"
          onClick={() =>
            q.plugin.starmap.planet.update.netSend({
              pluginId,
              solarSystemId,
              planetId: object.name,
              ringMapAsset: null,
            })
          }
        >
          Remove Rings
        </Button>
      </div>
    </PaletteDisclosure>
  );
}
