// Dependencies get bundled into the worker:
import Less from "less/lib/less";
const less = Less();
less.PluginLoader = function () {};

// Export as you would in a normal module:
export async function processLess(codeContents) {
  const rendered = await less.render(
    `#theme-container {
    ${codeContents}
  }`
  );
  return rendered.css;
}
