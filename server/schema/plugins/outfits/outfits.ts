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
import {TagsComponent} from "server/components/tags";
import {IdentityComponent} from "server/components/identity";
import Entity from "server/helpers/ecs/entity";
import uuid from "uniqid";
import {pubsub} from "server/helpers/pubsub";
import {getPlugin, publish} from "../basePlugin";
import {capitalCase} from "change-case";
import {outfitPublish} from "./utils";
import {getOutfitComponents, OutfitAbilities} from "./getOutfitComponents";
import App from "server/app";

@Resolver()
export class PluginOutfitResolver {
  @Query(returns => [Entity], {name: "pluginOutfits"})
  pluginOutfitsQuery(@Arg("pluginId", type => ID) pluginId: string): Entity[] {
    const plugin = getPlugin(pluginId);
    return plugin.outfits;
  }
  @Query(returns => [Entity])
  allPluginOutfits(): Entity[] {
    return App.plugins.reduce((prev: Entity[], next) => {
      return prev.concat(
        next.outfits.map(n => {
          const entity = n as Entity;
          entity.pluginId = next.id;
          entity.pluginName = next.name;
          return entity;
        })
      );
    }, []);
  }
  @Query(returns => Entity, {
    name: "pluginOutfit",
    nullable: true,
  })
  pluginOutfitQuery(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("id", type => ID) id: string
  ): Entity | null {
    const plugin = getPlugin(pluginId);
    return plugin.outfits.find(s => s.id === id) || null;
  }
  @Mutation(type => Entity)
  pluginAddOutfit(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("ability", type => OutfitAbilities)
    ability: OutfitAbilities,
    @Arg("name", {nullable: true})
    name: string = capitalCase(ability)
  ): Entity {
    const plugin = getPlugin(pluginId);
    if (plugin.outfits.find(s => s.identity?.name === name)) {
      throw new Error("An outfit with that name already exists.");
    }

    const components = getOutfitComponents(ability);
    const entity = new Entity(null, [
      IdentityComponent,
      TagsComponent,
      ...components.map(c => c.component),
    ]);
    entity.updateComponents(
      components.reduce((prev: {[key: string]: any}, next) => {
        // @ts-expect-error
        const id = next.component.id;
        prev[id] = next.defaultValue || {};
        return prev;
      }, {})
    );
    entity.updateComponent("identity", {name: capitalCase(ability)});
    plugin.outfits.push(entity);

    outfitPublish({plugin, outfit: entity});
    return entity;
  }

  @Mutation(type => String)
  pluginOutfitRemove(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("outfitId", type => ID)
    outfitId: string
  ): string {
    const plugin = getPlugin(pluginId);
    for (let i = 0; i < plugin.outfits.length; i++) {
      if (plugin.outfits[i].id === outfitId) {
        plugin.outfits.splice(i, 1);
        break;
      }
    }
    // TODO: Properly remove the outfit from any ships it is assigned to.

    publish(plugin);
    pubsub.publish("pluginOutfits", {
      pluginId: plugin.id,
      outfits: plugin.outfits,
    });
    return "";
  }
  @Subscription(returns => Entity, {
    nullable: true,
    topics: ({args, payload}) => {
      const id = uuid();
      const plugin = getPlugin(args.pluginId);
      const outfit = plugin?.outfits.find(s => s.id === args.id);

      process.nextTick(() => {
        pubsub.publish(id, {
          id: args.id,
          pluginId: args.pluginId,
          outfit,
        });
      });
      return [id, "pluginOutfit"];
    },
    filter: ({args, payload}) => {
      return args.id === payload.id && args.pluginId === payload.pluginId;
    },
  })
  pluginOutfit(
    @Root() payload: {id: string; outfit: Entity},
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("id", type => ID) id: string
  ): Entity {
    return payload.outfit;
  }

  @Subscription(returns => [Entity], {
    topics: ({args, payload}) => {
      const id = uuid();
      const plugin = getPlugin(args.pluginId);
      process.nextTick(() => {
        pubsub.publish(id, {
          pluginId: args.pluginId,
          outfits: plugin?.outfits,
        });
      });
      return [id, "pluginOutfits"];
    },
    filter({args, payload}) {
      return args.pluginId === payload.pluginId;
    },
  })
  pluginOutfits(
    @Root() payload: {outfits: Entity[]},
    @Arg("pluginId", type => ID) pluginId: string
  ): Entity[] {
    return payload.outfits || [];
  }
}
