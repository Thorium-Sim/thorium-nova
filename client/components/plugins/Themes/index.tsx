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
  useThemesSubscription,
} from "client/generated/graphql";
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {useTranslation} from "react-i18next";
import {FaPen, FaTimes} from "react-icons/fa";
import {
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
  useParams,
} from "react-router";
import Menubar from "../Outfits/Menubar";
import less from "less";
import MonacoEditor from "react-monaco-editor";
import {SampleClientContextProvider} from "client/components/clientLobby/ClientContext";
import StationViewer from "client/components/station";
import debounce from "lodash.debounce";

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
          <div
            className="flex"
            css={css`
              flex: 2;
            `}
          >
            <Outlet />
          </div>
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
      const rendered = await less.render(`#theme-container {
        ${lessCode}
      }`);
      setCssCode(cssCode => (cssCode ? cssCode : rendered.css));
    }
    setCss();
    setCodeContents(code => (code ? code : lessCode || ""));
  }, [lessCode]);

  const saveCss = debounce(async function saveCss(codeContents: string) {
    try {
      const rendered = await less.render(`#theme-container {
        ${codeContents}
      }`);
      setCssCode(rendered.css);
      setCss({
        variables: {
          pluginId,
          themeId,
          less: codeContents,
          css: rendered.css,
        },
      });
    } catch {
      // Do nothing.
    }
  }, 500);

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
  if (!code && code !== "") return null;
  return (
    <Fragment>
      <fieldset key={themeId} className="w-full">
        <div
          className="border border-white w-full bg-black overflow-hidden relative"
          css={css`
            width: 768px;
            height: 432px;
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
            <SampleClientContextProvider>
              <StationViewer />
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
    </Fragment>
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
