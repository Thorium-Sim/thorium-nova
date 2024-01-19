import ReactDOM from "react-dom/client";
import "./theme.css";
import App from "./App";
import "@fontsource/outfit";

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
