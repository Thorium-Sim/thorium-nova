// Dependencies get bundled into the worker:
import Less from "less/lib/less";
const less = Less();
less.PluginLoader = function () {};

async function processLess(codeContents) {
  const rendered = await less.render(
    `#theme-container {
    ${codeContents}
  }`
  );
  return rendered.css;
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = async e => {
  try {
    const less = await processLess(e.data.css);
    postMessage({less, id: e.data.id});
  } catch (err) {
    console.error("Less error", err);
  }
};
