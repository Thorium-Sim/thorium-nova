import {Button, FormControl, FormLabel, Image} from "@chakra-ui/core";
import UploadWell from "../../ui/uploadWell";
import React from "react";
import {useTranslation} from "react-i18next";
import {useConfigStore} from "../configStore";
import InfoTip from "../../ui/infoTip";
import {
  useUniversePlanetClearRingsMutation,
  useUniversePlanetSetCloudsMutation,
  useUniversePlanetSetRingsMutation,
  useUniversePlanetSetTextureMutation,
  useUniversePlanetClearCloudsMutation,
  useUniversePlanetAssetsSubscription,
} from "../../../generated/graphql";

const PlanetAssetsPalette: React.FC = () => {
  const {t} = useTranslation();
  const universeId = useConfigStore(store => store.universeId);
  const selectedObject = useConfigStore(store => store.selectedObject);
  const {data} = useUniversePlanetAssetsSubscription({
    variables: {id: universeId, objectId: selectedObject?.id || ""},
    skip: !selectedObject?.id,
  });
  const [setTexture] = useUniversePlanetSetTextureMutation();
  const [setClouds] = useUniversePlanetSetCloudsMutation();
  const [setRings] = useUniversePlanetSetRingsMutation();
  const [clearRings] = useUniversePlanetClearRingsMutation();
  const [clearClouds] = useUniversePlanetClearCloudsMutation();

  const planet =
    data?.pluginUniverseObject.isPlanet && data.pluginUniverseObject;

  if (!planet || !planet.isPlanet) return null;
  return (
    <>
      <FormControl>
        <FormLabel htmlFor="texture">
          {t("Texture")}{" "}
          <InfoTip>
            {t(
              "Image aspect ratio should be 2x1, with the dimensions as powers of two, eg. 512x256 or 2048x1024"
            )}
          </InfoTip>
        </FormLabel>

        <UploadWell
          accept="image/*"
          onChange={(files: FileList) =>
            setTexture({
              variables: {
                id: universeId,
                objectId: planet.id,
                image: files[0],
              },
            })
          }
        >
          <Image
            src={`${planet.isPlanet.textureMapAsset}?${new Date().getTime()}`}
            width="90%"
            height="90%"
            objectFit="contain"
            alt="Planet Texture"
          />
        </UploadWell>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="texture">
          {t("Clouds")}{" "}
          <InfoTip>
            {t(
              "Image should be a transparent PNG. The aspect ratio should be 2x1, with the dimensions as powers of two, eg. 512x256 or 2048x1024"
            )}
          </InfoTip>
        </FormLabel>

        <UploadWell
          accept="image/*"
          onChange={(files: FileList) =>
            setClouds({
              variables: {
                id: universeId,
                objectId: planet.id,
                image: files[0],
              },
            })
          }
        >
          {planet.isPlanet.cloudsMapAsset && (
            <Image
              src={`${planet.isPlanet.cloudsMapAsset}?${new Date().getTime()}`}
              width="90%"
              height="90%"
              objectFit="contain"
              alt="Clouds"
            />
          )}
        </UploadWell>
        {planet.isPlanet.cloudsMapAsset && (
          <Button
            width="100%"
            variant="ghost"
            variantColor="warning"
            onClick={() =>
              clearClouds({
                variables: {id: universeId, objectId: planet.id},
              })
            }
          >
            {t("Remove Clouds")}
          </Button>
        )}
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="texture">
          {t("Rings")}{" "}
          <InfoTip>
            {t(
              "Image should be a transparent PNG. Vertical lines in the image represent rings."
            )}
          </InfoTip>
        </FormLabel>

        <UploadWell
          accept="image/*"
          onChange={(files: FileList) =>
            setRings({
              variables: {
                id: universeId,
                objectId: planet.id,
                image: files[0],
              },
            })
          }
        >
          {planet.isPlanet.ringsMapAsset && (
            <Image
              src={`${planet.isPlanet.ringsMapAsset}?${new Date().getTime()}`}
              width="90%"
              height="90%"
              objectFit="contain"
              alt="Rings"
            />
          )}
        </UploadWell>
        {planet.isPlanet.ringsMapAsset && (
          <Button
            width="100%"
            variant="ghost"
            variantColor="warning"
            onClick={() =>
              clearRings({
                variables: {id: universeId, objectId: planet.id},
              })
            }
          >
            {t("Remove Rings")}
          </Button>
        )}
      </FormControl>
    </>
  );
};

export default PlanetAssetsPalette;
