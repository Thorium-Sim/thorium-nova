import {IJsonModel, Layout, Model, TabNode} from "flexlayout-react";
import {forwardRef, Suspense, useState} from "react";
import * as Cores from "../../cores";
import CardProvider from "client/src/context/CardContext";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {useLocalStorage} from "client/src/hooks/useLocalStorage";

export const CoreFlexLayout = forwardRef<Layout>((_, ref) => {
  const [initialModel, setInitialModel] = useLocalStorage<IJsonModel>(
    "core-flexLayout",
    defaultJson
  );
  const [layoutModel] = useState(() => Model.fromJson(initialModel));

  return (
    <Layout
      ref={ref}
      font={{
        size: "x-small",
      }}
      factory={flexLayoutFactory}
      model={layoutModel}
      supportsPopout={false}
      onModelChange={a => setInitialModel(a.toJson())}
    />
  );
});

CoreFlexLayout.displayName = "CoreFlexLayout";

function FlexCore({compName}: {compName: keyof typeof Cores}) {
  const Core = Cores[compName];
  if (Core)
    return (
      <CardProvider cardName={compName}>
        <Suspense fallback={<LoadingSpinner compact />}>
          <Core />
        </Suspense>
      </CardProvider>
    );
  return null;
}
function flexLayoutFactory(node: TabNode) {
  var component = node.getComponent() as keyof typeof Cores;

  return <FlexCore compName={component} />;
}
const defaultJson: IJsonModel = {
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
