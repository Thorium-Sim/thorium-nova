import ReactDOM from "react-dom";
import "./theme.css";
import App from "./App";
import {initializeTabId} from "@thorium/tab-id";

initializeTabId();

// TODO Aug 23 2021 - Configure this with the methods that come
// from the Electron preload script.
declare global {
  interface Window {
    isHeadless: boolean;
    thorium: {
      getAddress: () => Promise<string>;
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

ReactDOM.render(<App />, document.getElementById("root"));
