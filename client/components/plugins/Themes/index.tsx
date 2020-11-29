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
  useRef,
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
  const [codeContents, setCodeContents] = useState<string>("");
  const [cssCode, setCssCode] = useState<string>("");

  const themes = useContext(ThemesContext);
  const {pluginId, themeId} = useParams();

  const theme = themes.find(t => t.id === themeId);

  const lessCode = theme?.rawLESS;
  useEffect(() => {
    setCodeContents(code => (code ? code : lessCode || ""));
  }, [lessCode]);

  useEffect(() => {
    async function processLessCode() {
      try {
        const rendered = await less.render(`#theme-container {
          ${codeContents}
        }`);
        setCssCode(rendered.css);
      } catch {
        // Do nothing.
      }
    }
    processLessCode();
  }, [codeContents]);
  return [codeContents, setCodeContents, cssCode] as const;
};
const ThemeSettings = () => {
  const {pluginId, themeId} = useParams();
  const [setCss] = useThemeSetCssMutation();
  const [code, setCode, cssCode] = useCodeContents();
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
            id="theme-container"
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
      </fieldset>
    </Fragment>
  );
};
const ThemeRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ThemeConfig />}>
        <Route path=":phraseId/*" element={<ThemeSettings />} />
      </Route>
    </Routes>
  );
};

export default ThemeRoutes;
