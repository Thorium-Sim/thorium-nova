import Menubar, {useMenubar} from "@thorium/ui/Menubar";
import Button from "@thorium/ui/Button";
import type {Layout} from "@client/utils/FlexLayout";
import {useRef} from "react";
import "@client/utils/FlexLayout/dark.css";
import {AddCoreCombobox} from "./AddCoreCombobox";
import {CoreFlexLayout} from "./CoreFlexLayout";
import {ErrorBoundary} from "react-error-boundary";
import {CoreFlexLayoutProvider} from "./CoreFlexLayoutContext";
import {CoreFlexLayoutDropdown} from "./CoreFlexLayoutDropdown";
import {q} from "@client/context/AppContext";
import {capitalCase} from "change-case";
import {Icon} from "@thorium/ui/Icon";

export default function FlightDirectorLayout() {
  const layoutRef = useRef<Layout>(null);
  return (
    <CoreFlexLayoutProvider>
      <div className="h-full flex flex-col bg-black/70">
        <Menubar>
          <div className="relative flex-1">
            <CoreMenubar layoutRef={layoutRef} />
            <CoreFlexLayout ref={layoutRef} />
          </div>
        </Menubar>
      </div>
    </CoreFlexLayoutProvider>
  );
}

function CoreMenubar({layoutRef}: {layoutRef: React.RefObject<Layout>}) {
  useMenubar({
    children: (
      <>
        <Button
          className="btn-primary btn-xs btn-outline"
          onClick={() => q.client.setStation.netSend({shipId: null})}
        >
          <Icon name="arrow-left" />
        </Button>
        <AddCoreCombobox
          onChange={coreName => {
            layoutRef.current?.addTabToActiveTabSet?.({
              component: coreName,
              name: capitalCase(coreName.replace("Core", "")),
            });
          }}
        />
        <ErrorBoundary fallback={<></>}>
          <CoreFlexLayoutDropdown />
        </ErrorBoundary>
      </>
    ),
  });
  return null;
}
