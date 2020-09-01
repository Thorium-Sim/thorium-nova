import App from "server/app";
import {appStoreDir} from "server/helpers/appPaths";
import getStore from "server/helpers/dataStore";
import {pubsub} from "server/helpers/pubsub";
import {
  Arg,
  Ctx,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import UniverseTemplate from "../../universe";
import uuid from "uniqid";
import {FileUpload, GraphQLUpload} from "graphql-upload";
import uploadAsset from "server/helpers/uploadAsset";
import {getUniverse, publish} from "./utils";
import Entity from "server/helpers/ecs/entity";
import matchSorter from "match-sorter";
import {GraphQLContext} from "server/helpers/graphqlContext";

@Resolver()
export class UniversePluginBaseResolver {
  @Query(returns => [UniverseTemplate], {name: "templateUniverses"})
  universesQuery(): UniverseTemplate[] {
    return App.plugins.universes;
  }
  @Query(returns => UniverseTemplate, {
    name: "templateUniverse",
    nullable: true,
  })
  universeQuery(@Arg("id", type => ID) id: string): UniverseTemplate | null {
    return App.plugins.universes.find(s => s.id === id) || null;
  }

  @Query(returns => [Entity])
  universeSearch(
    @Arg("id", type => ID) id: string,
    @Arg("search", type => String) search: string,
    @Ctx() ctx: GraphQLContext
  ) {
    const universe = getUniverse(id);
    ctx.universeId = id;
    const matchItems = matchSorter(
      universe.entities
        .filter(e => e.isStar || e.isPlanet || e.planetarySystem)
        .map(m => ({
          ...m,
          name: m.identity?.name,
          description: m.identity?.description,
          temperature: m.temperature?.temperature,
          spectralType: m.isStar?.spectralType,
          classification: m.isPlanet?.classification,
          mass: m.isStar?.solarMass || m.isPlanet?.terranMass,
          population: m.population?.count,
        })),
      search,
      {
        keys: [
          "name",
          "description",
          "temperature",
          "spectralType",
          "classification",
          "mass",
          "population",
        ],
      }
    ).map(m => m.id);

    return universe.entities.filter(e => matchItems.includes(e.id));
  }
  @Mutation(returns => UniverseTemplate)
  universeCreate(
    @Arg("name")
    name: string
  ): UniverseTemplate {
    if (App.plugins.universes.find(s => s.name === name)) {
      throw new Error("A universe with that name already exists.");
    }
    const universe = getStore<UniverseTemplate>({
      class: UniverseTemplate,
      path: `${appStoreDir}universes/${name}/data.json`,
      initialData: new UniverseTemplate({name}),
    });

    App.plugins.universes.push(universe);

    publish(universe);
    return universe;
  }

  @Mutation(returns => String)
  universeRemove(
    @Arg("id", type => ID)
    id: string
  ) {
    const universe = getUniverse(id);
    try {
      universe.removeFile();
    } catch {}
    App.plugins.universes = App.plugins.universes.filter(u => u.id !== id);

    pubsub.publish("templateUniverses", {
      universes: App.plugins.universes,
    });
    return "";
  }

  @Mutation(returns => UniverseTemplate)
  universeSetName(
    @Arg("id", type => ID)
    id: string,
    @Arg("name")
    name: string
  ) {
    if (App.plugins.universes.find(s => s.name === name)) {
      throw new Error("A universe with that name already exists.");
    }
    const universe = getUniverse(id);
    universe.name = name;
    publish(universe);
    return universe;
  }

  @Mutation(returns => UniverseTemplate)
  universeSetDescription(
    @Arg("id", type => ID)
    id: string,
    @Arg("description")
    description: string
  ) {
    const universe = getUniverse(id);
    universe.description = description;
    publish(universe);
    return universe;
  }

  @Mutation(returns => UniverseTemplate)
  universeSetTags(
    @Arg("id", type => ID)
    id: string,
    @Arg("tags", type => [String])
    tags: string[]
  ) {
    const universe = getUniverse(id);
    universe.tags = tags;
    publish(universe);
    return universe;
  }

  @Mutation(returns => UniverseTemplate)
  async universeSetCoverImage(
    @Arg("id", type => ID)
    id: string,
    @Arg("image", type => GraphQLUpload) image: FileUpload
  ) {
    const universe = getUniverse(id);
    const pathPrefix = `${appStoreDir}universes/${universe.name}`;
    const splitName = image.filename.split(".");
    const ext = splitName[splitName.length - 1];
    await uploadAsset(image, pathPrefix, `cover.${ext}`);

    universe.coverImage = `cover.${ext}`;
    publish(universe);
    return universe;
  }

  @Subscription(returns => UniverseTemplate, {
    nullable: true,
    topics: ({args, payload}) => {
      const id = uuid();
      const universe = App.plugins.universes.find(t => t.id === args.id);
      process.nextTick(() => {
        pubsub.publish(id, {
          id: args.id,
          universe,
        });
      });
      return [id, "templateUniverse"];
    },
    filter: ({args, payload}) => {
      return args.id === payload.id;
    },
  })
  universe(
    @Root() payload: {id: string; universe: UniverseTemplate},
    @Arg("id", type => ID) id: string
  ): UniverseTemplate {
    return payload.universe;
  }

  @Subscription(returns => [UniverseTemplate], {
    topics: ({args, payload}) => {
      const id = uuid();
      process.nextTick(() => {
        pubsub.publish(id, {
          universes: App.plugins.universes,
        });
      });
      return [id, "templateUniverses"];
    },
  })
  universes(
    @Root() payload: {universes: UniverseTemplate[]}
  ): UniverseTemplate[] {
    return payload.universes || [];
  }
}
