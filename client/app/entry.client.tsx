import {RemixBrowser} from "@remix-run/react";
import {startTransition, StrictMode} from "react";
import {hydrateRoot} from "react-dom/client";

// TODO Aug 23 2021 - Configure this with the methods that come
// from the Electron preload script.
declare global {
  interface Window {
    isHeadless: boolean;
    thorium: {
      getAddress: () => Promise<string>;
      getHostSecret: () => Promise<string>;
      registerUpdateHandler: (handler: (update: string) => void) => void;
    };
  }
}

window.isHeadless = false;
window.addEventListener(
  "dragover",
  function (e) {
    e.preventDefault();
  },
  false
);
window.addEventListener(
  "drop",
  function (e) {
    e.preventDefault();
  },
  false
);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
