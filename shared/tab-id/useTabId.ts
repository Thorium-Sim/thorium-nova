import React from "react";
import {getTabId, setTabId, persistenceKey} from "./getTabId";

export function useTabId(): [string, (id: string) => void] {
  const [storedTabId, setTabIdFunc] = React.useState(
    sessionStorage.getItem(persistenceKey) || ""
  );
  const unmounted = React.useRef(false);
  async function runGetClientId() {
    const clientId = await getTabId();
    if (!unmounted.current) {
      setTabIdFunc(clientId);
    }
  }
  React.useEffect(() => {
    if (!storedTabId) {
      runGetClientId();
    }
    return () => {
      unmounted.current = true;
    };
  }, [storedTabId]);
  function doSetTabId(id: string) {
    setTabIdFunc(id);
    setTabId(id);
  }
  return [storedTabId, doSetTabId];
}
