import Menubar from "@thorium/ui/Menubar";
import {FaArrowLeft} from "react-icons/fa";
import Button from "@thorium/ui/Button";
import {netSend} from "client/src/context/netSend";
import {useThoriumAccount} from "client/src/context/ThoriumAccountContext";
import {useIssueTracker} from "../IssueTracker";
import {Layout} from "flexlayout-react";
import {useRef} from "react";
import "flexlayout-react/style/dark.css";
import {AddCoreCombobox} from "./AddCoreCombobox";
import {CoreFlexLayout} from "./CoreFlexLayout";

const IssueTrackerButton = () => {
  const {account} = useThoriumAccount();
  const {setOpen} = useIssueTracker();
  if (!account) return null;
  return (
    <Button
      className="btn-error btn-xs btn-outline"
      onClick={() => setOpen(true)}
    >
      Submit Issue
    </Button>
  );
};

export default function FlightDirectorLayout() {
  const layoutRef = useRef<Layout>(null);
  return (
    <div className="h-full flex flex-col bg-black/70">
      <Menubar>
        <Button
          className="btn-primary btn-xs btn-outline"
          onClick={() => netSend("clientSetStation", {shipId: null})}
        >
          <FaArrowLeft />
        </Button>
        <AddCoreCombobox
          onChange={coreName => {
            layoutRef.current?.addTabToActiveTabSet({
              component: coreName,
              name: coreName.replace("Core", ""),
            });
          }}
        />
        <div className="flex-1"></div>
        <IssueTrackerButton />
      </Menubar>
      <div className="relative flex-1">
        <CoreFlexLayout ref={layoutRef} />
      </div>
    </div>
  );
}
