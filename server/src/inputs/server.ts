import {DataContext} from "../utils/DataContext";

export const serverInputs = {
  serverSnapshot: (context: DataContext) => {
    const server = context.server;
    server.writeFile(true);
    server.plugins.forEach(plugin => {
      plugin.writeFile(true);
    });
    const flight = context.flight;
    flight?.writeFile(true);
  },
};
