import uniqid from "@thorium/uniqid";
export const persistenceKey = "tab_id_";

let tabId = sessionStorage.getItem(persistenceKey);
let windows: string[] = [];
let broadcastChannel: BroadcastChannel;
if (window.BroadcastChannel) {
  broadcastChannel = new BroadcastChannel("tab_id_tabCount");
}

let initialized = false;
// This tab ID implementation works as follows:
export async function initializeTabId() {
  initialized = true;
  if (window.BroadcastChannel) {
    broadcastChannel.onmessage = function (ev) {
      if (ev.data === "tabPing") {
        if (tabId) {
          broadcastChannel.postMessage(tabId);
        }
      } else {
        if (!windows.includes(ev.data)) windows.push(ev.data);
      }
    };
    const tabId = await getTabId();
  }
}

function setTabSession(id: string) {
  sessionStorage.setItem(persistenceKey, id);
  tabId = id;
}

async function timeout<T>(callback: () => T, timer: number): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, timer));
  return callback();
}
export function getTabIdSync() {
  return tabId;
}
export async function getTabId() {
  if (tabId) {
    return tabId;
  }
  if (!initialized) {
    await initializeTabId();
  }

  const tabList = getTabList();

  if (broadcastChannel) {
    broadcastChannel.postMessage("tabPing");
    // Lets give a bit of time for the windows to get back
    return await timeout(() => {
      if (tabId) {
        return tabId;
      }
      for (let i = 0; i < tabList.length; i++) {
        if (!windows.includes(tabList[i])) {
          setTabSession(tabList[i]);
          return tabList[i];
        }
      }
      if (!tabId) {
        const newTabId = uniqid("cli-");
        setTabSession(newTabId);
        tabList.push(newTabId);
        localStorage.setItem(persistenceKey, JSON.stringify(tabList));
        return newTabId;
      }
      return "this-should-never-happen";
    }, 500);
  } else {
    setTabSession(tabList[0]);
    return tabList[0];
  }
}
export function setTabId(id: string) {
  const tabList = getTabList();
  const tabIndex = tabList.indexOf(tabId || "");
  setTabSession(id);
  tabList[tabIndex] = id;
  localStorage.setItem(persistenceKey, JSON.stringify(tabList));
}

function getTabList() {
  let tabList: string[] = [];
  try {
    tabList = JSON.parse(localStorage.getItem(persistenceKey) || "[]");
  } catch {
    // It errored - it either doesn't exist or isn't JSON.
    // If it's blank, create a new one
  }

  if (tabList.length === 0) {
    tabList = [localStorage.getItem("tab_id_tabId") || uniqid("cli-")];
    localStorage.setItem(persistenceKey, JSON.stringify(tabList));
  }
  return tabList;
}
