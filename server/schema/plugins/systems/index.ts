import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {
  Arg,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import uuid from "uniqid";
import getStore from "server/helpers/dataStore";
import {appStoreDir} from "server/helpers/appPaths";

function publish(system: Entity) {
  pubsub.publish("templateSystems", {
    id: system.id,
    systems: App.plugins.systems,
  });
  pubsub.publish("templateSystem", {
    id: system.id,
    system,
  });
}
function getSystem(id: string) {
  const system = App.plugins.systems.find(s => s.id === id);
  if (!system) {
    throw new Error("Unable to find that system.");
  }
  return system;
}
@Resolver()
export class SystemPluginBaseResolver {
  @Query(returns => [Entity], {name: "templateSystems"})
  systemsQuery(): Entity[] {
    return App.plugins.systems;
  }
  @Query(returns => Entity, {
    name: "templateSystem",
    nullable: true,
  })
  systemQuery(@Arg("id", type => ID) id: string): Entity | null {
    return App.plugins.systems.find(s => s.id === id) || null;
  }
  @Mutation(returns => Entity)
  systemPluginCreate(
    @Arg("name")
    name: string,
    @Arg("ability")
    ability: string
  ): Entity {
    if (App.plugins.systems.find(s => s.identity?.name === name)) {
      throw new Error("A system with that name already exists.");
    }
    const entity = getStore<Entity>({
      class: Entity,
      path: `${appStoreDir}systems/${name}/data.json`,
      initialData: new Entity(null, [
        // TODO: Add in all the necessary components based on the ability
      ]),
    });

    App.plugins.systems.push(entity);

    publish(entity);
    return entity;
  }

  @Mutation(returns => String)
  systemPluginRemove(
    @Arg("id", type => ID)
    id: string
  ) {
    const system = getSystem(id);
    try {
      system.removeFile();
    } catch {}
    App.plugins.systems = App.plugins.systems.filter(s => s.id !== id);

    pubsub.publish("templateSystems", {
      systems: App.plugins.systems,
    });
    return "";
  }

  @Mutation(returns => Entity)
  systemPluginSetName(
    @Arg("id", type => ID)
    id: string,
    @Arg("name")
    name: string
  ) {
    if (App.plugins.systems.find(s => s.identity?.name === name)) {
      throw new Error("A system with that name already exists.");
    }
    const system = getSystem(id);
    system.updateComponent("identity", {name});
    publish(system);
    return system;
  }

  @Mutation(returns => Entity)
  systemPluginSetDescription(
    @Arg("id", type => ID)
    id: string,
    @Arg("description")
    description: string
  ) {
    const system = getSystem(id);
    system.updateComponent("identity", {description});
    publish(system);
    return system;
  }

  @Mutation(returns => Entity)
  systemPluginSetTags(
    @Arg("id", type => ID)
    id: string,
    @Arg("tags", type => [String])
    tags: string[]
  ) {
    const system = getSystem(id);
    system.updateComponent("tags", {tags});
    publish(system);
    return system;
  }

  @Subscription(returns => Entity, {
    nullable: true,
    topics: ({args, payload}) => {
      const id = uuid();
      const system = App.plugins.systems.find(t => t.id === args.id);
      process.nextTick(() => {
        pubsub.publish(id, {
          id: args.id,
          system,
        });
      });
      return [id, "templateSystem"];
    },
    filter: ({args, payload}) => {
      return args.id === payload.id;
    },
  })
  templateSystem(
    @Root() payload: {id: string; system: Entity},
    @Arg("id", type => ID) id: string
  ): Entity {
    return payload.system;
  }

  @Subscription(returns => [Entity], {
    topics: ({args, payload}) => {
      const id = uuid();
      process.nextTick(() => {
        pubsub.publish(id, {
          systems: App.plugins.systems,
        });
      });
      return [id, "templateSystems"];
    },
  })
  templateSystems(@Root() payload: {systems: Entity[]}): Entity[] {
    return payload.systems || [];
  }
}
