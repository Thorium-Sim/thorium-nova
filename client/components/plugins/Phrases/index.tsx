import {Box, Flex, Grid, Heading, IconButton} from "@chakra-ui/core";
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
import {
  usePhraseListsSubscription,
  usePhraseCreateMutation,
  usePhraseRemoveMutation,
  PhraseListsSubscription,
  usePhraseSetNameMutation,
  usePhraseSetUnitsMutation,
  usePhraseCategoryMutation,
  usePhraseParseLazyQuery,
  PhraseParseDocument,
} from "../../../generated/graphql";
import {useAlert, useConfirm, usePrompt} from "../../../components/Dialog";
import Input from "client/components/ui/Input";
import {css} from "@emotion/core";
import Button from "client/components/ui/button";
import uuid from "uniqid";
import {FiRepeat} from "react-icons/fi";
import ContextMenu from "client/components/ui/ContextMenu";
import {useApolloClient} from "@apollo/client";
import {FaBan, FaPlus, FaTimes} from "react-icons/fa";

const PhrasesContext = React.createContext<PhraseListsSubscription["phrases"]>(
  []
);

const PhrasesList: React.FC = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {pluginId} = useParams();
  const match = useMatch("/edit/:pluginId/phrases/:phraseId/*");
  const {phraseId} = match?.params || {};

  const {data} = usePhraseListsSubscription({variables: {pluginId}});
  const [create] = usePhraseCreateMutation();
  const [remove] = usePhraseRemoveMutation();
  const prompt = usePrompt();
  const confirm = useConfirm();
  const alert = useAlert();
  const setSelectedItem = React.useCallback(item => navigate(`${item}`), []);
  const renderItem = React.useCallback(
    c => (
      <div className="flex items-center">
        <div className="flex-1">
          {c.label}
          <SamplePhrase simple phraseId={c.id} />
        </div>
        <Button
          size="sm"
          aria-label={t("Remove Phrase")}
          variantColor="danger"
          onClick={async e => {
            e.preventDefault();
            if (
              await confirm({
                header: `Are you sure you want to delete ${c.label}?`,
              })
            ) {
              remove({variables: {pluginId, id: c.id}});
              navigate(`/edit/${pluginId}/ships`);
            }
          }}
        >
          <FaTimes />
        </Button>
      </div>
    ),
    [pluginId]
  );
  return (
    <div className="flex p-8 py-12 h-full flex-col bg-blackAlpha-500 overflow-y-hidden">
      <Menubar backLink />
      <h1 className="font-bold text-3xl">{t(`Phrases`)}</h1>
      <div className="flex flex-1 gap-4 h-0">
        <div className="flex flex-1 flex-col">
          <SearchableList
            selectedItem={phraseId}
            setSelectedItem={setSelectedItem}
            items={
              data?.phrases.map(o => ({
                id: o.id,
                label: o.name,
                category: o.category,
              })) || []
            }
            renderItem={renderItem}
          />
          <Button
            onClick={async () => {
              const name = await prompt({
                header: t("What is the name of the new phrase list?"),
              });
              if (!name || typeof name !== "string") return;
              const response = await create({variables: {name, pluginId}});
              if (response?.errors?.[0].message) {
                await alert({
                  header: t("Error creating phrase list."),
                  body: response?.errors?.[0].message,
                });
                return;
              }
              navigate(`${response.data?.phraseCreate.id}`);
            }}
          >
            {t(`New Phrase List`)}
          </Button>
        </div>
        <PhrasesContext.Provider value={data?.phrases || []}>
          <div
            className="flex"
            css={css`
              flex: 2;
            `}
          >
            <Outlet />
          </div>
        </PhrasesContext.Provider>
      </div>
    </div>
  );
};

const PhraseSettings = () => {
  const [error, setError] = React.useState(false);
  const phrases = React.useContext(PhrasesContext);
  const {pluginId, phraseId} = useParams();
  const [setName] = usePhraseSetNameMutation();
  const [setCategory] = usePhraseCategoryMutation();
  const [setContents] = usePhraseSetUnitsMutation();

  const {t} = useTranslation();
  const phrase = phrases.find(p => p.id === phraseId);
  if (!phrase) return null;
  return (
    <>
      <fieldset key={phraseId} className="flex-1 overflow-y-auto">
        <div className="flex flex-wrap">
          <div className="flex-1 pr-4">
            <div className="pb-4">
              <Input
                labelHidden={false}
                isInvalid={error}
                invalidMessage={t("Name is required")}
                label={t(`Name`)}
                defaultValue={phrase?.name}
                onChange={() => setError(false)}
                onBlur={(e: any) =>
                  e.target.value
                    ? setName({
                        variables: {
                          pluginId,
                          phraseId,
                          name: e.target.value,
                        },
                      })
                    : setError(true)
                }
              />
            </div>
            <div className="pb-4">
              <label className="w-full">
                <Input
                  labelHidden={false}
                  label={t(`Category`)}
                  type="textarea"
                  defaultValue={phrase?.category}
                  onBlur={(e: any) =>
                    setCategory({
                      variables: {
                        pluginId,
                        phraseId,
                        category: e.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>
      </fieldset>
      <div
        css={css`
          flex: 2;
        `}
      >
        {phrase && (
          <>
            <h2 className="text-2xl font-bold">Phrases List</h2>
            <PhraseInput items={phrase.units} />

            <Button
              as="select"
              variantColor="success"
              className="mt-5"
              onChange={(e: any) => {
                setContents({
                  variables: {
                    pluginId,
                    phraseId,
                    units:
                      phrase?.units
                        .map(c => ({
                          id: c.id,
                          type: c.type,
                          contents: c.contents,
                        }))
                        .concat({
                          id: uuid(),
                          type: e.target.value,
                          contents: [],
                        }) || [],
                  },
                });
              }}
              value="nothing"
            >
              <option value="nothing">Add Unit to Phrase</option>
              <option value="word">Word List</option>
              <option value="phrase">Phrase List</option>
              <option value="space">Space</option>
            </Button>
            <SamplePhrase />
          </>
        )}
      </div>
    </>
  );
};

const SamplePhrase = React.memo<{phraseId?: string; simple?: boolean}>(
  ({phraseId: propsPhraseId = "", simple = false}) => {
    const client = useApolloClient();
    const {phraseId: paramPhraseId} = useParams();
    const phraseId = propsPhraseId || paramPhraseId;
    const [phraseParse, setPhraseParse] = React.useState();
    const getPhrase = React.useCallback(
      async function getPhrase() {
        setPhraseParse(
          (
            await client.query({
              query: PhraseParseDocument,
              variables: {phraseId},
              fetchPolicy: "network-only",
            })
          ).data.phraseParse
        );
      },
      [phraseId]
    );
    React.useEffect(() => {
      getPhrase();
    }, [getPhrase]);
    return (
      <>
        {!simple && <h3 className="text-xl font-bold mt-4">Sample Phrase:</h3>}
        <div className="flex items-center">
          {!simple && (
            <Button className="mr-2" onClick={getPhrase}>
              <FiRepeat />
            </Button>
          )}
          <p className={simple ? "text-xs" : ""}>{phraseParse || "\u00A0"}</p>
        </div>
      </>
    );
  }
);

type PhraseItems = NonNullable<
  ReturnType<typeof usePhraseListsSubscription>["data"]
>["phrases"][0]["units"];
const PhraseInput: React.FC<{
  items: PhraseItems;
}> = ({items}) => {
  const [openWindow, setOpenWindow] = React.useState<null | {
    x: number;
    y: number;
    id: string | null;
    type: string;
    contents: string;
  }>(null);
  const {t} = useTranslation();
  const [setContents] = usePhraseSetUnitsMutation();
  const {pluginId, phraseId} = useParams();

  return (
    <div>
      {items.map((item, index, arr) => {
        return (
          <React.Fragment key={item.id}>
            <Button
              variantColor={
                item.type === "space"
                  ? "secondary"
                  : item.type === "word"
                  ? "alert"
                  : "primary"
              }
              onClick={e => {
                if (item.type === "space") return;
                const target = e.target as HTMLButtonElement;
                const bounds = target.getBoundingClientRect();
                setOpenWindow({
                  x: bounds.x,
                  y: bounds.bottom,
                  id: item.id,
                  type: item.type,
                  contents: item.contents.join("\n"),
                });
              }}
            >
              {item.type === "word"
                ? t(`Word List: {{itemCount}} Items`, {
                    itemCount: item.contents.length.toString(),
                  })
                : item.type === "phrase"
                ? t(`Phrase List: {{itemCount}} Items`, {
                    itemCount: item.contents.length.toString(),
                  })
                : t(`[Space]`)}
              <div
                className="p-2 rounded hover:bg-red-600 hover:bg-opacity-50"
                onClick={e => {
                  e.stopPropagation();
                  setContents({
                    variables: {
                      pluginId,
                      phraseId,
                      units: items
                        .filter(i => i.id !== item.id)
                        .map(({__typename, ...i}) => i),
                    },
                  });
                  setOpenWindow(null);
                }}
              >
                <FaBan className="text-red-600 " />
              </div>
            </Button>
            {index < arr.length - 1 && <p className="inline px-2 text-xl">+</p>}
          </React.Fragment>
        );
      })}
      {openWindow && (
        <OpenWindow
          {...openWindow}
          items={items}
          close={() => setOpenWindow(null)}
        />
      )}
    </div>
  );
};

const OpenWindow: React.FC<{
  x: number;
  y: number;
  contents: string;
  id: string | null;
  type: string;
  items: PhraseItems;
  close: () => void;
}> = ({x, y, contents, id, type, items, close}) => {
  const {pluginId, phraseId} = useParams();
  const phrases = React.useContext(PhrasesContext);

  const [setContents] = usePhraseSetUnitsMutation();
  const [textareaData, setTextAreaData] = React.useState(contents);
  const {t} = useTranslation();
  return (
    <ContextMenu x={x} y={y}>
      {type === "word" && (
        <textarea
          className=" bg-black border border-purple-600 text-white h-64 w-64 p-2 whitespace-no-wrap resize"
          placeholder="Enter word options, one option per line"
          value={textareaData}
          onChange={e => setTextAreaData(e.target.value)}
        ></textarea>
      )}
      {type === "phrase" && (
        <div className=" bg-blackAlpha-900 h-64 w-64 border border-purple-600 flex flex-col">
          <SearchableList
            items={
              phrases
                .filter(p => p.id !== phraseId)
                .map(o => ({
                  id: o.id,
                  label: o.name,
                  category: o.category,
                })) || []
            }
            renderItem={c => (
              <div key={c.id} className="flex items-center">
                <div className="flex-1">{c.label}</div>
                {textareaData.split("\n").includes(c.id) ? (
                  <Button
                    size="sm"
                    aria-label={t("Remove Phrase")}
                    variantColor="danger"
                    onClick={async e => {
                      e.preventDefault();
                      setTextAreaData(d =>
                        d
                          .split("\n")
                          .filter(f => f !== c.id)
                          .filter(Boolean)

                          .join("\n")
                      );
                    }}
                  >
                    <FaTimes />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    aria-label={t("Add Phrase")}
                    variantColor="success"
                    onClick={async e => {
                      e.preventDefault();
                      setTextAreaData(d => {
                        return d
                          .split("\n")
                          .filter(Boolean)
                          .concat(c.id)
                          .join("\n");
                      });
                    }}
                  >
                    <FaPlus />
                  </Button>
                )}
              </div>
            )}
          />
        </div>
      )}
      <div className="flex">
        <Button size="sm" variantColor="danger" onClick={() => close()}>
          Cancel
        </Button>
        <Button
          size="sm"
          variantColor="success"
          onClick={() => {
            setContents({
              variables: {
                pluginId,
                phraseId,
                units: items.map(({__typename, ...i}) =>
                  i.id === id
                    ? {
                        id: i.id,
                        type: i.type,
                        contents: textareaData.split("\n"),
                      }
                    : i
                ),
              },
            });
            close();
          }}
        >
          Save
        </Button>
      </div>
    </ContextMenu>
  );
};
const ShipsConfig = () => {
  return (
    <Routes>
      <Route path="/" element={<PhrasesList></PhrasesList>}>
        <Route path=":phraseId/*" element={<PhraseSettings />} />
      </Route>
    </Routes>
  );
};

export default ShipsConfig;
