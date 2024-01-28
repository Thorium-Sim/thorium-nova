import {useConfirm, usePrompt} from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import {Navigate, Outlet, useParams, useNavigate} from "react-router-dom";
import {toast} from "@client/context/ToastContext";
import {
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {Editor} from "@client/components/MonacoEditor";
import debounce from "lodash.debounce";
import {useLocalStorage} from "@client/hooks/useLocalStorage";
import Input from "@thorium/ui/Input";
import {AssetPreview} from "@thorium/ui/AssetPreview";
import InfoTip from "@thorium/ui/InfoTip";
import type ThemePlugin from "server/src/classes/Plugins/Theme";
// import StationLayout from "@client/components/Station/StationLayout";
import normalLogo from "@client/images/logo.svg?url";
import colorLogo from "@client/images/logo-color.svg?url";
import {q} from "@client/context/AppContext";
import {MockNetRequestContext} from "@thorium/live-query/client/mockContext";
import {Icon} from "@thorium/ui/Icon";

const StationLayout = () => (
  <>
    <div className="w-[960px] h-20 bg-blue-500" />
  </>
);

export default function ThemeLayout() {
  const {themeId, pluginId} = useParams() as {
    themeId: string;
    pluginId: string;
  };
  const navigate = useNavigate();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const [theme] = q.plugin.theme.get.useNetRequest({pluginId, themeId});

  const [shipName, setShipName] = useLocalStorage(
    "theme-ship-name",
    "USS Testing"
  );
  const [stationName, setStationName] = useLocalStorage(
    "theme-station-name",
    "Command"
  );
  const [alertLevel, setAlertLevel] = useLocalStorage(
    "theme-notice-level",
    "5"
  );

  const [previewViewscreen, setPreviewViewscreen] = useState(false);

  if (!themeId || !theme) return <Navigate to={`/config/${pluginId}/themes`} />;

  return (
    <>
      <div className="flex w-full gap-8">
        <div className="flex-col flex-grow flex gap-2 h-full">
          <Editor
            className="flex-1"
            defaultValue={theme.rawCSS}
            onChange={debounce(
              async e => {
                await q.plugin.theme.update.netSend({
                  pluginId: pluginId,
                  themeId: themeId,
                  rawCSS: e,
                });
              },
              300,
              {trailing: true, maxWait: 1000}
            )}
            theme="vs-dark"
            language="less"
            options={{
              minimap: {
                enabled: false,
              },
            }}
          />

          <div className="flex gap-4">
            <Button
              className="btn-outline btn-error"
              disabled={!themeId}
              onClick={async () => {
                if (
                  !themeId ||
                  !(await confirm({
                    header: "Are you sure you want to delete this theme?",
                    body: "All content for this theme, including images and other assets, will be gone forever.",
                  }))
                )
                  return;
                q.plugin.theme.delete.netSend({pluginId, themeId});
                navigate(`/config/${pluginId}/themes`);
              }}
            >
              Delete Theme
            </Button>
            <Button
              className="btn-outline btn-notice"
              disabled={!themeId}
              onClick={async () => {
                if (!pluginId) return;
                const name = await prompt({
                  header: "What is the name of the duplicated plugin?",
                });
                if (!name || typeof name !== "string") return;
                try {
                  const result = await q.plugin.theme.duplicate.netSend({
                    pluginId: pluginId,
                    themeId,
                    name,
                  });
                  navigate(`/config/${pluginId}/themes/${result.themeId}`);
                } catch (err) {
                  if (err instanceof Error) {
                    toast({
                      title: "Error duplicating plugin",
                      body: err.message,
                      color: "error",
                    });
                    return;
                  }
                }
              }}
            >
              Duplicate Theme
            </Button>
            <Button
              className="btn-outline btn-info"
              disabled={!themeId}
              onClick={() => setPreviewViewscreen(v => !v)}
            >
              Preview {previewViewscreen ? "Station" : "Viewscreen"}
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-grow-0 flex-col w-[384px]">
          <div
            className="border border-white bg-black w-[384px] overflow-hidden relative z-10 transition-transform transform hover:scale-[3] origin-top-right"
            style={{
              aspectRatio: "16/9",
            }}
          >
            <div
              className="w-[1920px] h-[1080px] absolute left-0 top-0 bg-gray-800"
              style={{
                transform: `scale(0.2) translate(-200%, -200%)`,
              }}
            >
              <style dangerouslySetInnerHTML={{__html: theme.processedCSS}} />
              <MockNetRequestContext.Provider
                value={{
                  client: {
                    get: {
                      id: "Test",
                      name: "Test Client",
                      connected: true,
                      loginName: "Test User",
                    },
                  } as any,
                  flight: null,
                  ship: {
                    get: {
                      id: 0,
                      components: {
                        isPlayerShip: {value: true},
                        identity: {name: shipName},
                        isShip: {
                          assets: {
                            logo: normalLogo,
                          },
                          category: "Cruiser",
                          registry: "NCC-2016-A",
                          shipClass: "Astra Cruiser",
                        },
                      },
                      alertLevel,
                    },
                  } as any,
                  station: {
                    get: {
                      name: previewViewscreen ? "Viewscreen" : stationName,
                      logo: "",
                      cards: previewViewscreen
                        ? [
                            {
                              icon: colorLogo,
                              name: "Viewscreen",
                              component: "ViewscreenDemo",
                            },
                          ]
                        : [
                            {
                              icon: colorLogo,
                              name: "Component Demo",
                              component: "ComponentDemo",
                            },
                            {
                              icon: colorLogo,
                              name: "Test Card",
                              component: "Login",
                            },
                          ],
                    },
                  } as any,
                  theme: {get: null},
                }}
              >
                <Suspense fallback={null}>
                  <StationLayout />
                </Suspense>
              </MockNetRequestContext.Provider>
            </div>
          </div>
          <Input
            label="Ship Name"
            labelHidden={false}
            value={shipName}
            onChange={e => setShipName(e.target.value)}
          ></Input>
          <Input
            label="Station Name"
            labelHidden={false}
            value={stationName}
            onChange={e => setStationName(e.target.value)}
          ></Input>
          <label className="block">
            Alert Level
            <select
              value={alertLevel}
              onChange={e => setAlertLevel(e.target.value)}
              className="w-32 select select-sm block"
            >
              <option>5</option>
              <option>4</option>
              <option>3</option>
              <option>2</option>
              <option>1</option>
              <option>p</option>
            </select>
          </label>
          <ThemeAssetUpload assets={theme.assets} />
        </div>
      </div>
      <Outlet />
    </>
  );
}

const ThemeAssetUpload = ({assets}: {assets: ThemePlugin["assets"]}) => {
  const {themeId, pluginId} = useParams() as {
    themeId: string;
    pluginId: string;
  };
  // const theme = useNetRequest("pluginTheme", {pluginId, themeId});

  const [dragging, setDragging] = useState(false);
  async function onChange(files: FileList) {
    if (!files.length) return;
    const file = files[0];
    q.plugin.theme.uploadFile.netSend({
      pluginId,
      themeId,
      file,
      fileName: file.name,
    });
  }

  const accept = /(image|font)\/.*/gi;
  const acceptString = "image/*, font/*,.ttf,.eot,.woff,.woff2";
  // Drag and drop is hard to test
  /* istanbul ignore next */
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const acceptMatch = !accept || e.dataTransfer.items[0].type.match(accept);

    if (e.dataTransfer.items?.length === 1 && acceptMatch) {
      setDragging(true);
      e.dataTransfer.dropEffect = "copy";
    } else {
      setDragging(false);
      e.dataTransfer.dropEffect = "none";
    }
  }
  /* istanbul ignore next */
  function handleDragExit(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }
  /* istanbul ignore next */
  function handleDrop(e: React.DragEvent) {
    const acceptMatch = !accept || e.dataTransfer.items[0].type.match(accept);

    if (!acceptMatch) return;
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length === 1) {
      onChange(files);
    }
  }

  return (
    <>
      <div className="flex mt-4">
        <h3 className="font-bold text-2xl">Theme Assets</h3>
        <InfoTip>
          Click on an asset to copy the asset URL to your clipboard.
        </InfoTip>
      </div>
      <div
        className={`flex-1 relative overflow-y-auto rounded-lg transition-colors ${
          dragging ? "bg-black/80" : "bg-black/50"
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragExit}
        onDragEnd={handleDragExit}
        onDrop={handleDrop}
      >
        {dragging && (
          <div className="absolute h-full w-full bg-black/50 flex items-center justify-center pointer-events-none">
            <span className="font-bold text-4xl">Drag file to upload.</span>
          </div>
        )}
        {assets.files.map(file => {
          return <UploadedFile file={file} key={file} />;
        })}
      </div>
      <label className="w-full btn btn-info">
        Upload Asset
        <input
          type="file"
          hidden
          accept={acceptString}
          multiple={false}
          value={""}
          onChange={e => {
            if (e.target?.files?.length === 1) {
              onChange(e.target.files);
            }
          }}
        />
      </label>
    </>
  );
};

const useClipboard = () => {
  const [state, setState] = useState<"idle" | "copied">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const copy = useCallback(function copy(str: string) {
    const el = Object.assign(document.createElement("textarea"), {
      value: str,
    });
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setState("copied");
    timeoutRef.current = setTimeout(() => {
      setState("idle");
    }, 3000);
  }, []);
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current as any);
    };
  }, []);
  return {copy, state};
};

const UploadedFile: React.FC<{file: string}> = ({file}) => {
  const {themeId, pluginId} = useParams() as {
    themeId: string;
    pluginId: string;
  };

  // TODO November 27, 2021 : Implement the function for removing the asset
  function remove(input: any) {}
  const confirm = useConfirm();
  const {copy, state} = useClipboard();

  return (
    <li key={file} className="list-group-item" onClick={() => copy(file)}>
      <div className="flex items-center justify-between w-full">
        <AssetPreview url={file} className="max-h-8 text-2xl" />
        <span className=" mx-2 flex-1 overflow-x-hidden overflow-ellipsis">
          {state === "copied"
            ? "Copied!"
            : file.split("/")[file.split("/").length - 1]}
        </span>
        <Button
          className="btn-error btn-sm"
          onClick={async () => {
            if (
              await confirm({
                header: "Are you sure you want to remove this asset?",
                body: "The file will be deleted permanently.",
              })
            ) {
              q.plugin.theme.removeFile.netSend({
                pluginId,
                themeId,
                file,
              });
            }
          }}
        >
          <Icon name="ban" />
        </Button>
      </div>
    </li>
  );
};
