import {useParams, Link} from "react-router-dom";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useReducer} from "react";
import InfoTip from "@thorium/ui/InfoTip";
import UploadWell from "@thorium/ui/UploadWell";
import {readFile} from "client/src/utils/readFile";
import {renderGLTFPreview} from "client/src/utils/generateGltfImage";
import {toast} from "client/src/context/ToastContext";
import {netSend} from "client/src/context/netSend";

export function Assets() {
  const {pluginId, shipId} = useParams() as {pluginId: string; shipId: string};
  const data = useNetRequest("pluginShips", {pluginId});
  const ship = data.find(d => d.name === shipId);
  const [, render] = useReducer(() => ({}), {});
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-4 overflow-y-auto">
      <div>
        <h3 className="text-lg font-bold flex items-center">
          Logo{" "}
          <InfoTip>
            Logos should be square and have a transparent background. SVGs work
            best.
          </InfoTip>
        </h3>
        <UploadWell
          accept="image/*"
          onChange={async files => {
            await netSend("pluginShipSetLogo", {
              pluginId,
              shipId,
              logo: files[0],
            });
            render();
          }}
        >
          {ship?.assets.logo && (
            <img
              src={`${ship.assets.logo}?${new Date().getTime()}`}
              alt="Ship Logo"
              className="w-10/12 h-10/12 object-cover"
            />
          )}
        </UploadWell>
      </div>
      <div>
        <h3 className="text-lg font-bold flex items-center">
          Model{" "}
          <InfoTip>
            Models should be in .glb format. Top and side views are
            automatically generated from the model.
            {/* TODO November 1 2021 - Write a page about how to create 3D models */}
            <Link to="/docs">Read about how to create compatible models.</Link>
          </InfoTip>
        </h3>
        <UploadWell
          accept="model/gltf-binary"
          onChange={async files => {
            toast({
              title: "Uploading",
              body: "Model is uploading. Please wait...",

              color: "info",
            });
            try {
              const file = files[0];
              const result = await readFile(file);
              const [topSrc, sideSrc, vanitySrc] = await Promise.all([
                renderGLTFPreview(result, {
                  size: {width: 1200, height: 1200},
                  camera: {fov: 50, x: 0, y: 0, z: 3},
                }),
                renderGLTFPreview(result, {
                  size: {width: 1200, height: 1200},
                  camera: {fov: 50, x: 3, y: 0, z: 0, rotateZ: Math.PI / 2},
                }),
                renderGLTFPreview(result, {
                  size: {width: 1200, height: 1200},
                  camera: {
                    fov: 60,
                    x: 1.2,
                    y: 1.5,
                    z: 1.2,
                    rotateZ: (3 * Math.PI) / 4,
                  },
                }),
              ]);
              await netSend("pluginShipSetModel", {
                pluginId,
                shipId,
                model: file,
                top: await (await fetch(topSrc)).blob(),
                side: await (await fetch(sideSrc)).blob(),
                vanity: await (await fetch(vanitySrc)).blob(),
              });
              toast({
                title: "Upload Complete",
                color: "success",
              });
              render();
            } catch (err: unknown) {
              toast({
                title: "Upload Failed",
                body: err instanceof Error ? err.message : "",
                color: "error",
              });
            }
          }}
        >
          {ship?.assets.vanity && (
            <img
              src={`${ship.assets.vanity}?${new Date().getTime()}`}
              alt="Ship Vanity View"
              className="w-10/12 h-10/12 object-cover"
            />
          )}
        </UploadWell>
      </div>
      <div>
        <h3 className="text-lg font-bold flex items-center">Side View</h3>
        <UploadWell disabled>
          {ship?.assets.sideView && (
            <img
              src={`${ship.assets.sideView}?${new Date().getTime()}`}
              alt="Ship Side View"
              className="w-10/12 h-10/12 object-cover"
            />
          )}
        </UploadWell>
      </div>
      <div>
        <h3 className="text-lg font-bold flex items-center">Top View</h3>
        <UploadWell disabled>
          {ship?.assets.topView && (
            <img
              src={`${ship.assets.topView}?${new Date().getTime()}`}
              alt="Ship Top View"
              className="w-10/12 h-10/12 object-cover"
            />
          )}
        </UploadWell>
      </div>
    </div>
  );
}
