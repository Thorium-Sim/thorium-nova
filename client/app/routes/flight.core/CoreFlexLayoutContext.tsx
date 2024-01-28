import {useLocalStorage} from "@client/hooks/useLocalStorage";
import {IJsonModel, Model} from "@client/utils/FlexLayout";
import {createContext, ReactNode, useMemo, useState} from "react";

export const CoreFlexLayoutContext = createContext<{
  layoutModel: Model;
  setLayoutModel: (newModel: Model) => void;
  setInitialModel: (newModel: IJsonModel) => void;
}>(null!);

export const CoreFlexLayoutProvider = ({children}: {children: ReactNode}) => {
  const [initialModel, setInitialModel] = useLocalStorage<IJsonModel>(
    "core-flexLayout",
    defaultJson
  );
  const [layoutModel, setLayoutModel] = useState(() =>
    Model.fromJson(initialModel)
  );
  const value = useMemo(
    () => ({layoutModel, setLayoutModel, setInitialModel}),
    [layoutModel, setLayoutModel, setInitialModel]
  );

  return (
    <CoreFlexLayoutContext.Provider value={value}>
      {children}
    </CoreFlexLayoutContext.Provider>
  );
};

export const defaultJson: IJsonModel = {
  global: {
    splitterSize: 1,
    splitterExtra: 4,
    tabEnableFloat: true,
    tabSetEnableClose: true,
    tabSetMinWidth: 100,
    tabSetMinHeight: 100,
    borderMinSize: 100,
    borderEnableAutoHide: true,
    enableEdgeDock: true,
  },
  borders: [
    {
      type: "border",
      location: "bottom",
      children: [],
    },
    {
      type: "border",
      location: "left",
      children: [],
    },
    {
      type: "border",
      location: "right",
      children: [],
    },
  ],
  layout: {
    type: "row",

    children: [],
  },
};
