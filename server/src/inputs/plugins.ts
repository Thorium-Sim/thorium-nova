import BasePlugin from "../classes/Plugins";
import {DataContext} from "../utils/DataContext";
import {pubsub} from "../utils/pubsub";

export const pluginInputs = {
  pluginCreate(context: DataContext, params: {name: string}) {
    const plugin = new BasePlugin(params);
    context.server.plugins.push(plugin);
    pubsub.publish("pluginsList");
    pubsub.publish("plugin", {pluginId: plugin.id});
    return plugin.id;
  },
};
