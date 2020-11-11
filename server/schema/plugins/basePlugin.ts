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
import App from "server/app";
import {Writable} from "server/helpers/writable";
import Entity from "server/helpers/ecs/entity";
import StationComplement from "../stationComplement";
import getStore from "server/helpers/dataStore";
import {appStoreDir} from "server/helpers/appPaths";
import {pubsub} from "server/helpers/pubsub";
import {FileUpload, GraphQLUpload} from "graphql-upload";
import uploadAsset from "server/helpers/uploadAsset";
import {Phrase} from "../phrases";

export function getPlugin(id: string) {
  const plugin = App.plugins.find(u => u.id === id);
  if (!plugin) {
    throw new Error("Unable to find that plugin.");
  }
  return plugin;
}

export function publish(plugin: BasePlugin) {
  pubsub.publish("plugins", {
    id: plugin.id,
    plugins: App.plugins,
  });
  pubsub.publish("plugin", {
    id: plugin.id,
    plugin,
  });
}

@ObjectType()
export default class BasePlugin {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  author: string;

  @Field()
  description: string;

  @Field(type => String)
  get coverImage() {
    return this._coverImage
      ? `/assets/plugins/${this.name}/${this._coverImage}`
      : "";
  }
  set coverImage(value) {
    this._coverImage = value;
  }
  _coverImage!: string;

  @Field(type => [String])
  tags: string[];

  excludeFields: (keyof BasePlugin)[] = [
    "ships",
    "outfits",
    "stationComplements",
    "universe",
    "phrases",
    "factions",
    "excludeFields",
  ];

  @Field(type => [Entity])
  ships: Writable<Entity[]>;

  @Field(type => [Entity])
  outfits: Writable<Entity[]>;

  @Field(type => [StationComplement])
  stationComplements: Writable<StationComplement[]>;

  @Field(type => [Entity])
  universe: Writable<Entity[]>;

  @Field(type => [Entity])
  factions: Writable<Entity[]>;

  @Field(type => [Phrase])
  phrases: Writable<Phrase[]>;

  constructor(params: Partial<BasePlugin> = {}) {
    this.id = params.id || uuid();
    this.name = params.name || "New Plugin";
    this.author = params.author || "";
    this.description = params.description || "A great plugin";
    this.coverImage = params._coverImage || "";
    this.tags = params.tags || [];

    // Properties
    this.ships = getStore<Entity[]>({
      class: Entity,
      path: `${appStoreDir}plugins/${this.name}/ships.json`,
      initialData: [],
    });
    this.outfits = getStore<Entity[]>({
      class: Entity,
      path: `${appStoreDir}plugins/${this.name}/outfits.json`,
      initialData: [],
    });
    this.stationComplements = getStore<StationComplement[]>({
      class: StationComplement,
      path: `${appStoreDir}plugins/${this.name}/stationComplement.json`,
      initialData: [],
    });
    this.universe = getStore<Entity[]>({
      class: Entity,
      path: `${appStoreDir}plugins/${this.name}/universe.json`,
      initialData: [],
    });
    this.factions = getStore<Entity[]>({
      class: Entity,
      path: `${appStoreDir}plugins/${this.name}/factions.json`,
      initialData: [],
    });
    this.phrases = getStore<Phrase[]>({
      class: Phrase,
      path: `${appStoreDir}plugins/${this.name}/phrases.json`,
      initialData: [],
    });
  }
  async writeFile(force?: boolean) {}
  async removeFile(force?: boolean) {}

  save() {
    this.writeFile(true);
  }
  serialize() {
    const data = {...this};
    this.excludeFields.forEach(field => {
      delete data[field];
    });
    this.excludeFields.forEach(field => {
      const objects = this[field] as Writable<any[]>;
      if (objects.length > 0) {
        objects.writeFile?.(true);
      }
    });
    return data;
  }
}

@Resolver()
export class PluginResolver {
  @Query(returns => [BasePlugin], {name: "plugins"})
  pluginsQuery(): BasePlugin[] {
    return App.plugins;
  }
  @Query(returns => BasePlugin, {
    name: "plugin",
    nullable: true,
  })
  pluginQuery(@Arg("id", type => ID) id: string): BasePlugin | null {
    return App.plugins.find(s => s.id === id) || null;
  }

  @Mutation(returns => BasePlugin)
  pluginCreate(
    @Arg("name")
    name: string
  ): BasePlugin {
    if (App.plugins.find(s => s.name === name)) {
      throw new Error("A plugin with that name already exists.");
    }
    const plugin = getStore<BasePlugin>({
      class: BasePlugin,
      path: `${appStoreDir}plugins/${name}/plugin.json`,
      initialData: new BasePlugin({name}),
    });

    App.plugins.push(plugin);

    publish(plugin);
    return plugin;
  }

  @Mutation(returns => String)
  pluginRemove(
    @Arg("id", type => ID)
    id: string
  ) {
    const plugin = getPlugin(id);
    try {
      plugin.removeFile();
    } catch {}
    App.plugins = App.plugins.filter(u => u.id !== id);

    pubsub.publish("plugins", {
      plugins: App.plugins,
    });
    return "";
  }

  @Mutation(returns => BasePlugin)
  pluginSetName(
    @Arg("id", type => ID)
    id: string,
    @Arg("name")
    name: string
  ) {
    if (App.plugins.find(s => s.name === name)) {
      throw new Error("A plugin with that name already exists.");
    }
    const plugin = getPlugin(id);
    plugin.name = name;
    publish(plugin);
    return plugin;
  }

  @Mutation(returns => BasePlugin)
  pluginSetDescription(
    @Arg("id", type => ID)
    id: string,
    @Arg("description")
    description: string
  ) {
    const plugin = getPlugin(id);
    plugin.description = description;
    publish(plugin);
    return plugin;
  }

  @Mutation(returns => BasePlugin)
  pluginSetTags(
    @Arg("id", type => ID)
    id: string,
    @Arg("tags", type => [String])
    tags: string[]
  ) {
    const plugin = getPlugin(id);
    plugin.tags = tags;
    publish(plugin);
    return plugin;
  }

  @Mutation(returns => BasePlugin)
  async pluginSetCoverImage(
    @Arg("id", type => ID)
    id: string,
    @Arg("image", type => GraphQLUpload) image: FileUpload
  ) {
    const plugin = getPlugin(id);
    const pathPrefix = `${appStoreDir}plugins/${plugin.name}`;
    const splitName = image.filename.split(".");
    const ext = splitName[splitName.length - 1];
    await uploadAsset(image, pathPrefix, `cover.${ext}`);

    plugin.coverImage = `cover.${ext}`;
    publish(plugin);
    return plugin;
  }

  @Subscription(returns => BasePlugin, {
    nullable: true,
    topics: ({args, payload}) => {
      const id = uuid();
      const plugin = App.plugins.find(t => t.id === args.id);
      process.nextTick(() => {
        pubsub.publish(id, {
          id: args.id,
          plugin,
        });
      });
      return [id, "plugin"];
    },
    filter: ({args, payload}) => {
      return args.id === payload.id;
    },
  })
  plugin(
    @Root() payload: {id: string; plugin: BasePlugin},
    @Arg("id", type => ID) id: string
  ): BasePlugin {
    return payload.plugin;
  }

  @Subscription(returns => [BasePlugin], {
    topics: ({args, payload}) => {
      const id = uuid();
      process.nextTick(() => {
        pubsub.publish(id, {
          plugins: App.plugins,
        });
      });
      return [id, "plugins"];
    },
  })
  plugins(@Root() payload: {plugins: BasePlugin[]}): BasePlugin[] {
    return payload.plugins || [];
  }
}
