import {css} from "@emotion/core";
import {useAlert, useConfirm, usePrompt} from "client/components/Dialog";
import Button from "client/components/ui/button";
import SearchableList from "client/components/ui/SearchableList";
import {
  ThemesSubscription,
  useThemeCreateMutation,
  useThemeRemoveMutation,
  useThemeSetCssMutation,
  useThemeSetNameMutation,
  useThemeAssetRemoveMutation,
  useThemeAssetUploadMutation,
  useThemesSubscription,
} from "client/generated/graphql";
import {
  createContext,
  Dispatch,
  FC,
  Fragment,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {useTranslation} from "react-i18next";
import {FaBan, FaPen, FaTimes} from "react-icons/fa";
import {
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
  useParams,
} from "react-router";
import Menubar from "../Outfits/Menubar";
import MonacoEditor from "react-monaco-editor";
import {SampleClientContextProvider} from "client/components/clientLobby/ClientContext";
import StationViewer from "client/components/station";
import debounce from "lodash.debounce";
import ListGroupItem from "client/components/ui/ListGroupItem";
import InfoTip from "client/components/ui/infoTip";
import {useClipboard} from "@chakra-ui/core";
import Input from "client/components/ui/Input";
import useLocalStorage from "client/helpers/hooks/useLocalStorage";
import {processLess} from "./processTheme.comlink";
import {AssetPreview} from "./AssetPreview";

const ThemesContext = createContext<ThemesSubscription["themes"]>([]);
const ThemeConfig = () => {
  const {pluginId} = useParams();
  const {t} = useTranslation();
  const match = useMatch("/edit/:pluginId/themes/:themeId/*");
  const {themeId} = match?.params || {};

  const {data} = useThemesSubscription({variables: {pluginId}});
  const navigate = useNavigate();

  const [remove] = useThemeRemoveMutation();
  const [create] = useThemeCreateMutation();
  const [rename] = useThemeSetNameMutation();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const alert = useAlert();
  const setSelectedItem = useCallback(item => navigate(`${item}`), [navigate]);

  const renderItem = useCallback(
    c => (
      <div className="flex items-center">
        <div className="flex-1">{c.label}</div>
        <Button
          className="mr-2"
          size="sm"
          aria-label={t("Rename Theme")}
          variantColor="info"
          onClick={async e => {
            e.preventDefault();
            const name = await prompt({
              header: `What is the new name for ${c.label}?`,
            });
            if (name && typeof name === "string") {
              rename({variables: {pluginId, themeId: c.id, name}});
            }
          }}
        >
          <FaPen />
        </Button>
        <Button
          size="sm"
          aria-label={t("Remove Theme")}
          variantColor="danger"
          onClick={async e => {
            e.preventDefault();
            if (
              await confirm({
                header: `Are you sure you want to delete ${c.label}?`,
              })
            ) {
              remove({variables: {pluginId, themeId: c.id}});
              navigate(`/edit/${pluginId}/themes`);
            }
          }}
        >
          <FaTimes />
        </Button>
      </div>
    ),
    [confirm, navigate, pluginId, prompt, remove, rename, t]
  );

  const themes = data?.themes;
  if (!themes) return null;
  return (
    <div className="flex p-8 py-12 h-full flex-col bg-blackAlpha-500 overflow-y-hidden">
      <Menubar backLink />
      <h1 className="font-bold text-3xl">{t(`Themes`)}</h1>
      <div className="flex flex-1 gap-4 h-0">
        <div className="flex flex-1 flex-col">
          <SearchableList
            items={themes.map(theme => ({id: theme.id, label: theme.name}))}
            selectedItem={themeId}
            setSelectedItem={setSelectedItem}
            renderItem={renderItem}
          />
          <Button
            onClick={async () => {
              const name = await prompt({
                header: t("What is the name of the new theme?"),
              });
              if (!name || typeof name !== "string") return;
              const response = await create({variables: {name, pluginId}});
              if (response?.errors?.[0].message) {
                await alert({
                  header: t("Error creating theme."),
                  body: response?.errors?.[0].message,
                });
                return;
              }
              navigate(`${response.data?.themeCreate.id}`);
            }}
          >
            {t(`New Theme`)}
          </Button>
        </div>
        <ThemesContext.Provider value={themes}>
          <Outlet />
        </ThemesContext.Provider>
      </div>
    </div>
  );
};

const useCodeContents = () => {
  const [codeContents, setCodeContents] = useState<string | null>(null);
  const [cssCode, setCssCode] = useState<string>("");

  const themes = useContext(ThemesContext);
  const {pluginId, themeId} = useParams();
  const [setCss, {loading}] = useThemeSetCssMutation();
  const theme = themes.find(t => t.id === themeId);
  const lessCode = theme?.rawLESS;

  useEffect(() => {
    async function setCss() {
      const css = await processLess(lessCode);

      setCssCode(cssCode => (cssCode ? cssCode : css));
    }
    setCss();
    setCodeContents(code => (code ? code : lessCode || ""));
  }, [lessCode]);

  const saveCss = debounce(async function saveCss(codeContents: string) {
    try {
      const css = await processLess(codeContents);
      setCssCode(css);
      setCss({
        variables: {
          pluginId,
          themeId,
          less: codeContents,
          css: css,
        },
      });
    } catch {
      // Do nothing.
    }
  }, 1000);

  return [codeContents, saveCss, cssCode, loading] as const;
};

const defaultStyles = `
.card-frame {
    
}
.card-frame-ship-name {
    
}
.card-frame-ship-logo {
    
}
.card-frame-ship-logo-image {
    
}
.card-frame-station-name {
    
}
.card-frame-station-logo {
    
}
.card-frame-station-logo-image {
    
}
.card-frame-card-name {
    
}
.card-frame-card-icon {
    
}
.card-frame-card-icon-image {
    
}
.card-frame-login-name {
    
}
.card-frame-login-profile {
    
}
.card-area {
    
}
.card-switcher-holder {
    
}
.card-switcher {
    
}
.card-switcher-button {
    
}
.card-switcher-button-icon {
    
}
.card-switcher-button-name {
    
}`;

const ThemeSettings = () => {
  const {themeId} = useParams();
  const [code, setCode, cssCode, loading] = useCodeContents();
  const [shipName, setShipName] = useLocalStorage(
    "theme-ship-name",
    "USS Testing"
  );
  const [stationName, setStationName] = useLocalStorage(
    "theme-station-name",
    "Command"
  );
  const [alertLevel, setAlertLevel] = useLocalStorage("theme-alert-level", "5");
  if (!code && code !== "") return null;
  return (
    <Fragment>
      <div
        className="flex gap-4"
        css={css`
          flex: 2;
        `}
      >
        <fieldset key={themeId}>
          <div
            className="border border-white w-full bg-black overflow-hidden relative"
            css={css`
              width: 768px;
              height: 432px;
              z-index: 4;
              transition: transform 0.4s ease;
              &:hover {
                transform: scale(2) translate(0%, 25%);
              }
            `}
          >
            <div
              css={css`
                width: 1920px;
                height: 1080px;
                left: 0;
                top: 0;
                transform: scale(0.4) translate(-75%, -75%);
              `}
            >
              <style dangerouslySetInnerHTML={{__html: cssCode}}></style>
              <SampleClientContextProvider
                shipName={shipName}
                stationName={stationName}
              >
                <StationViewer alertLevel={alertLevel} />
              </SampleClientContextProvider>
            </div>
          </div>
          <MonacoEditor
            width="768"
            height="432"
            language="less"
            theme="vs-dark"
            defaultValue={code}
            options={{minimap: {enabled: false}}}
            onChange={newCode => {
              setCode(newCode);
            }}
          />
          {loading ? "Saving..." : ""}
        </fieldset>
        <ThemeAssetUpload
          shipName={shipName}
          setShipName={setShipName}
          stationName={stationName}
          setStationName={setStationName}
          alertLevel={alertLevel}
          setAlertLevel={setAlertLevel}
        />
      </div>
    </Fragment>
  );
};

const ThemeAssetUpload: FC<{
  shipName: string;
  setShipName: Dispatch<SetStateAction<string>>;
  stationName: string;
  setStationName: Dispatch<SetStateAction<string>>;
  alertLevel: string;
  setAlertLevel: Dispatch<SetStateAction<string>>;
}> = ({
  shipName,
  setShipName,
  stationName,
  setStationName,
  alertLevel,
  setAlertLevel,
}) => {
  const {themeId, pluginId} = useParams();
  const themes = useContext(ThemesContext);
  const theme = themes.find(t => t.id === themeId);
  const [dragging, setDragging] = useState(false);
  const {t} = useTranslation();
  const [upload] = useThemeAssetUploadMutation();
  async function onChange(files: FileList) {
    await Promise.all(
      Array.from(files).map(image =>
        upload({variables: {themeId, pluginId, image}})
      )
    );
  }

  const accept = "image/*, font/*,.ttf,.eot,.woff,.woff2";
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
    <div className="flex-1 flex flex-col h-full">
      <h3 className="font-bold text-4xl">
        Theme Assets{" "}
        <InfoTip>
          {t("Click on an asset to copy the asset URL to your clipboard.")}
        </InfoTip>
      </h3>
      <div
        className="flex-1 relative overflow-y-auto"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragExit}
        onDragEnd={handleDragExit}
        onDrop={handleDrop}
      >
        {dragging && (
          <div className="absolute h-full w-full bg-blackAlpha-500 flex items-center justify-center pointer-events-none">
            <span className="font-bold text-4xl">
              {t("Drag file to upload.")}
            </span>
          </div>
        )}
        {theme?.uploadedImages.map(image => {
          return <UploadedImage image={image} key={image} />;
        })}
      </div>
      <div className="space-y-2">
        <Button className="w-full" as="label">
          {t("Upload Asset")}
          <input
            type="file"
            hidden
            accept={accept}
            multiple={false}
            value={""}
            onChange={e => {
              if (e.target?.files?.length === 1) {
                onChange(e.target.files);
              }
            }}
          />
        </Button>
        <Button className="w-full" variantColor="info">
          {t("Insert Template Code")}
        </Button>
        <Input
          label="Ship Name"
          labelHidden={false}
          value={shipName}
          onChange={e => setShipName(e)}
        ></Input>
        <Input
          label="Station Name"
          labelHidden={false}
          value={stationName}
          onChange={e => setStationName(e)}
        ></Input>
        <label>
          Alert Level
          <select
            value={alertLevel}
            onChange={e => setAlertLevel(e.target.value)}
            className="bg-blackAlpha-500 border border-whiteAlpha-500 ml-4 w-32"
          >
            <option>5</option>
            <option>4</option>
            <option>3</option>
            <option>2</option>
            <option>1</option>
            <option>p</option>
          </select>
        </label>
      </div>
    </div>
  );
};

const UploadedImage: React.FC<{image: string}> = ({image}) => {
  const {themeId, pluginId} = useParams();

  const [remove] = useThemeAssetRemoveMutation();
  const confirm = useConfirm();
  const {hasCopied, onCopy} = useClipboard(image);
  const {t} = useTranslation();

  return (
    <ListGroupItem key={image} className="flex items-center" onClick={onCopy}>
      <AssetPreview url={image} className="max-h-8" />
      <span className=" mx-2 flex-1 overflow-x-hidden overflow-ellipsis">
        {hasCopied
          ? t("Copied!")
          : image.split("/")[image.split("/").length - 1]}
      </span>
      <Button
        variantColor="danger"
        onClick={async () => {
          if (
            await confirm({
              header: "Are you sure you want to remove this asset?",
              body: "The file will be deleted permanently.",
            })
          ) {
            remove({variables: {themeId, pluginId, image}});
          }
        }}
      >
        <FaBan />
      </Button>
    </ListGroupItem>
  );
};
const ThemeRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ThemeConfig />}>
        <Route path=":themeId/*" element={<ThemeSettings />} />
      </Route>
    </Routes>
  );
};

export default ThemeRoutes;
