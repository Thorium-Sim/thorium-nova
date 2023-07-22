import Menubar from "@thorium/ui/Menubar";
import {FaArrowLeft} from "react-icons/fa";
import Button from "@thorium/ui/Button";
import type {Layout} from "flexlayout-react";
import {useRef} from "react";
import "flexlayout-react/style/dark.css";
import {AddCoreCombobox} from "./AddCoreCombobox";
import {CoreFlexLayout} from "./CoreFlexLayout";
import {ErrorBoundary} from "react-error-boundary";
import {CoreFlexLayoutProvider} from "./CoreFlexLayoutContext";
import {CoreFlexLayoutDropdown} from "./CoreFlexLayoutDropdown";
import {q} from "@client/context/AppContext";
import {capitalCase} from "change-case";

export default function FlightDirectorLayout() {
  const layoutRef = useRef<Layout>(null);
  return (
    <CoreFlexLayoutProvider>
      <div className="h-full flex flex-col bg-black/70">
        <Menubar>
          <Button
            className="btn-primary btn-xs btn-outline"
            onClick={() => q.client.setStation.netSend({shipId: null})}
          >
            <FaArrowLeft />
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
        </Menubar>
        <div className="relative flex-1">
          <CoreFlexLayout ref={layoutRef} />
        </div>
      </div>
    </CoreFlexLayoutProvider>
  );
}
