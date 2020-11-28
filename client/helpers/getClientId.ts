/* istanbul ignore file */
import React from "react";

import uuid from "uniqid";
import {
  useClientConnectMutation,
  useClientDisconnectMutation,
} from "../generated/graphql";

const key = "nova_clientPersistentId";
let clientId = sessionStorage.getItem(key);
let windows: string[] = [];
let broadcastChannel: BroadcastChannel;
if (window.BroadcastChannel) {
  broadcastChannel = new BroadcastChannel("thorium_clientCount");
}
// This client ID implementation works as follows:
export function initializeClient() {
  if (window.BroadcastChannel) {
    broadcastChannel.onmessage = function (ev) {
      if (ev.data === "clientPing") {
        if (clientId) {
          broadcastChannel.postMessage(clientId);
        }
      } else {
        if (!windows.includes(ev.data)) windows.push(ev.data);
      }
    };
    getClientId();
  }
}

function setClient(id: string) {
  sessionStorage.setItem(key, id);
  clientId = id;
}

async function timeout<T>(callback: () => T, timer: number): Promise<T> {
  await new Promise(resolve => setTimeout(resolve, timer));
  return callback();
}
export async function getClientId() {
  if (clientId) {
    return clientId;
  }

  const clientList = getClientList();

  if (broadcastChannel) {
    broadcastChannel.postMessage("clientPing");
    // Lets give a bit of time for the windows to get back
    return await timeout(() => {
      if (clientId) {
        return clientId;
      }
      for (let i = 0; i < clientList.length; i++) {
        if (!windows.includes(clientList[i])) {
          setClient(clientList[i]);
          return clientList[i];
        }
      }
      if (!clientId) {
        const newClientId = uuid();
        setClient(newClientId);
        clientList.push(newClientId);
        localStorage.setItem(key, JSON.stringify(clientList));
        return newClientId;
      }
      return "this-should-never-happen";
    }, 500);
  } else {
    setClient(clientList[0]);
    return clientList[0];
  }
}
export function setClientId(id: string) {
  const clientList = getClientList();
  const clientIndex = clientList.indexOf(clientId || "");
  setClient(id);
  clientList[clientIndex] = id;
  localStorage.setItem(key, JSON.stringify(clientList));
}

function getClientList() {
  let clientList: string[] = [];
  try {
    clientList = JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    // It errored - it either doesn't exist or isn't JSON.
    // If it's blank, create a new one
  }

  if (clientList.length === 0) {
    clientList = [localStorage.getItem("thorium_clientId") || uuid()];
    localStorage.setItem(key, JSON.stringify(clientList));
  }
  return clientList;
}

export function useClientId(): [string, (id: string) => void] {
  const [storedClientId, setClientIdFunc] = React.useState(clientId || "");
  const unmounted = React.useRef(false);
  async function runGetClientId() {
    const clientId = await getClientId();
    if (!unmounted.current) {
      setClientIdFunc(clientId);
    }
  }
  React.useEffect(() => {
    if (!storedClientId) {
      runGetClientId();
    }
    () => {
      unmounted.current = true;
    };
  }, [storedClientId]);
  function doSetClientId(id: string) {
    setClientIdFunc(id);
    setClientId(id);
  }
  return [storedClientId, doSetClientId];
}

export function useClientRegistration() {
  const [connect] = useClientConnectMutation();
  const [disconnect] = useClientDisconnectMutation();
  const [clientId] = useClientId();

  React.useEffect(() => {
    if (clientId) {
      connect();

      return () => {
        disconnect();
      };
    }
  }, [clientId]);
}
