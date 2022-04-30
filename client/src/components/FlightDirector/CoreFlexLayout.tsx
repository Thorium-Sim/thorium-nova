import {Layout, TabNode} from "flexlayout-react";
import {forwardRef, Suspense, useContext} from "react";
import * as Cores from "../../cores";
import CardProvider from "client/src/context/CardContext";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {CoreFlexLayoutContext} from "./CoreFlexLayoutContext";

export const CoreFlexLayout = forwardRef<Layout>((_, ref) => {
  const {layoutModel, setInitialModel} = useContext(CoreFlexLayoutContext);

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

function flexLayoutFactory(node: TabNode) {
  var compName = node.getComponent() as keyof typeof Cores;

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
