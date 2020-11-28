import App from "server/app";
import {pubsub} from "server/helpers/pubsub";
import {
  Arg,
  Field,
  ID,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import uuid from "uniqid";
import {getPlugin} from "../basePlugin";

@ObjectType()
export class Theme {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  rawLESS: string;

  @Field()
  processedCSS: string;

  @Field(type => [String])
  uploadedImages: string[];

  constructor(params: Partial<Theme> = {}) {
    this.id = params.id || uuid();
    this.name = params.name || "New Phrase";
    this.rawLESS = params.rawLESS || "";
    this.processedCSS = params.processedCSS || "";
    this.uploadedImages = params.uploadedImages || [];
  }
}

@Resolver()
export class ThemesResolver {
  @Query(returns => Theme, {name: "theme"})
  theme(@Arg("themeId", type => ID) themeId: string): Theme {
    const theme = App.plugins.reduce((prev: Theme | null, next) => {
      if (prev) return prev;
      return next.themes.find(t => t.id === themeId) || null;
    }, null);
    if (!theme) throw new Error("Cannot find theme");
    return theme;
  }
  @Mutation(returns => Theme)
  themeCreate(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("name") name: string
  ) {
    const plugin = getPlugin(pluginId);
    const theme = new Theme({name});
    plugin.themes.push(theme);
    pubsub.publish("themes", {pluginId, themes: plugin.themes});
    return theme;
  }
  @Mutation(returns => String)
  themeRemove(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("id", type => ID) id: string
  ) {
    const plugin = getPlugin(pluginId);
    for (let i = 0; i < plugin.themes.length; i++) {
      if (plugin.themes[i].id === id) {
        plugin.themes.splice(i, 1);
        break;
      }
    }
    pubsub.publish("themes", {pluginId, themes: plugin.themes});
    return "";
  }
  @Mutation(returns => Theme)
  themeSetName(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("themeId", type => ID) themeId: string,
    @Arg("name") name: string
  ) {
    const plugin = getPlugin(pluginId);
    const theme = plugin.themes.find(p => p.id === themeId);
    if (!theme) throw new Error("Cannot find theme");
    theme.name = name;
    pubsub.publish("themes", {pluginId, themes: plugin.themes});
    return theme;
  }
  @Mutation(returns => Theme)
  themeSetCSS(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("themeId", type => ID) themeId: string,
    @Arg("css") css: string,
    @Arg("less") less: string
  ) {
    const plugin = getPlugin(pluginId);
    const theme = plugin.themes.find(p => p.id === themeId);
    if (!theme) throw new Error("Cannot find theme");
    theme.processedCSS = css;
    theme.rawLESS = less;
    pubsub.publish("themes", {pluginId, themes: plugin.themes});
    return theme;
  }
  @Subscription(returns => [Theme], {
    topics: ({args: {pluginId}}) => {
      const subId = uuid();
      process.nextTick(() => {
        const plugin = getPlugin(pluginId);
        pubsub.publish(subId, {
          pluginId,
          themes: plugin.themes,
        });
      });
      return [subId, "themes"];
    },
    filter: ({payload, args: {pluginId}}) => {
      return payload.pluginId === pluginId;
    },
  })
  themes(
    @Root() payload: {themes: Theme[]},
    @Arg("pluginId", type => ID) pluginId?: string
  ): Theme[] {
    return payload.themes;
  }
}
