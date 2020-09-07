import App from "server/app";
import {pubsub} from "server/helpers/pubsub";

export function publish(plugin: SystemPlugin) {
  pubsub.publish("systemPlugins", {
    id: plugin.id,
    plugins: App.plugins.systems,
  });
  pubsub.publish("systemPlugin", {
    id: plugin.id,
    plugin,
  });
}
export function getSystemPlugin(id: string) {
  const plugin = App.plugins.systems.find(s => s.id === id);
  if (!plugin) {
    throw new Error("Unable to find that system plugin.");
  }
  return plugin;
}
