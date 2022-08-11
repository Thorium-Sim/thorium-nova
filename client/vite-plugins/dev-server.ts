import type {FastifyInstance} from "fastify";
import type {Connect, UserConfig, Plugin, ViteDevServer} from "vite";
import type http from "http";
import {exit} from "process";

export const PLUGIN_NAME = "vite-plugin-node";

declare interface RequestAdapterParams<App> {
  app: App;
  server: ViteDevServer;
  req: http.IncomingMessage;
  res: http.ServerResponse;
  next: Connect.NextFunction;
}
declare type RequestAdapter<App = any> = (
  params: RequestAdapterParams<App>
) => void | Promise<void>;

interface VitePluginNodeConfig {
  appPath: string;
  appName?: string;
  exportName?: string;
}
declare interface ViteConfig extends UserConfig {
  VitePluginNodeConfig: VitePluginNodeConfig;
}

const FastifyHandler: RequestAdapter<FastifyInstance> = async ({
  app,
  req,
  res,
}) => {
  await app.ready();
  app.routing(req, res);
};

const getPluginConfig = (server: ViteDevServer): VitePluginNodeConfig => {
  const plugin = server.config.plugins.find(
    p => p.name === PLUGIN_NAME
  ) as Plugin;

  if (!plugin) {
    console.error("Please setup VitePluginNode in your vite.config.js first");
    exit(1);
  }

  return (plugin.config!({}, {command: "serve", mode: ""}) as ViteConfig)
    .VitePluginNodeConfig;
};

const createMiddleware = (server: ViteDevServer): Connect.HandleFunction => {
  const config = getPluginConfig(server);
  const logger = server.config.logger;
  const requestHandler = FastifyHandler;

  if (!requestHandler) {
    console.error("Failed to find a request handler");
    process.exit(1);
  }

  return async function (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: Connect.NextFunction
  ): Promise<void> {
    const appModule = await server.ssrLoadModule(config.appPath);
    let app = appModule[config.exportName!];
    if (!app) {
      logger.error(
        `Failed to find a named export ${config.exportName} from ${config.appPath}`
      );
      process.exit(1);
    } else {
      // some app may be created with a function returning a promise
      app = await app;
      await requestHandler({app, server, req, res, next});
    }
  };
};

export function VitePluginNode(cfg: VitePluginNodeConfig): Plugin {
  const config: VitePluginNodeConfig = {
    appPath: cfg.appPath,
    appName: cfg.appName ?? "app",
    exportName: cfg.exportName ?? "viteNodeApp",
  };

  return {
    name: PLUGIN_NAME,
    config: () => {
      const plugincConfig: UserConfig & {
        VitePluginNodeConfig: VitePluginNodeConfig;
      } = {
        build: {
          ssr: config.appPath,
          rollupOptions: {
            input: config.appPath,
          },
        },
        server: {
          hmr: false,
        },
        optimizeDeps: {
          // Vite does not work well with optionnal dependencies,
          // mark them as ignored for now
          exclude: ["@swc/core"],
        },
        VitePluginNodeConfig: config,
      };

      return plugincConfig;
    },
    configureServer: server => {
      server.middlewares.use(createMiddleware(server));
    },
  };
}
