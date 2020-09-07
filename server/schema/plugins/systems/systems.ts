import {
  Arg,
  ID,
  Mutation,
  Query,
  registerEnumType,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import {TagsComponent} from "server/components/tags";
import {IsSystemComponent} from "server/components/shipSystems/isSystem";
import {IdentityComponent} from "server/components/identity";
import {WarpEnginesComponent} from "server/components/shipSystems/warpEngines";
import {NavigationComponent} from "server/components/shipSystems/navigation";
import {JumpDriveComponent} from "server/components/shipSystems/jumpDrive";
import {ImpulseEnginesComponent} from "server/components/shipSystems/impulseEngines";
import {ThrustersComponent} from "server/components/shipSystems/thrusters";
import {DamageComponent} from "server/components/shipSystems/damage";
import {EfficiencyComponent} from "server/components/shipSystems/efficiency";
import {PowerComponent} from "server/components/shipSystems/power";
import {HeatComponent} from "server/components/heat";
import {Component} from "server/components/utils";
import Entity from "server/helpers/ecs/entity";
import App from "server/app";
import {getSystemPlugin, publish} from "./utils";
import uuid from "uniqid";
import {pubsub} from "server/helpers/pubsub";

enum SystemAbilities {
  warpEngines,
  impulseEngines,
  thrusters,
  navigation,
  jumpDrive,
  generic,
}
registerEnumType(SystemAbilities, {
  name: "SystemAbilities",
});

function getSystemComponents(
  ability: SystemAbilities
): {component: Component; defaultValue?: any}[] {
  switch (ability) {
    case SystemAbilities.warpEngines:
      return [
        {component: WarpEnginesComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
      ];
    case SystemAbilities.impulseEngines:
      return [
        {component: ImpulseEnginesComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
      ];
    case SystemAbilities.thrusters:
      return [
        {component: ThrustersComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
      ];
    case SystemAbilities.navigation:
      return [
        {component: NavigationComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
      ];
    case SystemAbilities.jumpDrive:
      return [
        {component: JumpDriveComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
      ];
    case SystemAbilities.generic:
      return [{component: PowerComponent}, {component: DamageComponent}];
    default:
      return [];
  }
}

function systemPublish({
  plugin,
  system,
}: {
  plugin: SystemPlugin;
  system: Entity;
}) {
  publish(plugin);
  pubsub.publish("systemPluginSystems", {
    pluginId: plugin.id,
    systems: plugin.systems,
  });
  pubsub.publish("systemPluginSystem", {
    pluginId: plugin.id,
    id: system.id,
    system,
  });
}

@Resolver()
export class SystemPluginsSystemsResolver {
  @Query(returns => [Entity], {name: "systemPluginSystems"})
  systemPluginSystemsQuery(
    @Arg("pluginId", type => ID) pluginId: string
  ): Entity[] {
    const plugin = getSystemPlugin(pluginId);
    return plugin.systems;
  }
  @Query(returns => Entity, {
    name: "systemPluginSystem",
    nullable: true,
  })
  systemPluginSystemQuery(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("id", type => ID) id: string
  ): Entity | null {
    const plugin = getSystemPlugin(pluginId);
    return plugin.systems.find(s => s.id === id) || null;
  }
  @Mutation()
  systemPluginAddSystem(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("name")
    name: string,
    @Arg("ability", type => SystemAbilities)
    ability: SystemAbilities
  ): Entity {
    const plugin = getSystemPlugin(pluginId);
    if (plugin?.systems.find(s => s.identity?.name === name)) {
      throw new Error("A system with that name already exists.");
    }

    const components = getSystemComponents(ability);
    const entity = new Entity(null, [
      IdentityComponent,
      TagsComponent,
      IsSystemComponent,
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

    plugin.systems.push(entity);

    systemPublish({plugin, system: entity});
    return entity;
  }

  @Subscription(returns => Entity, {
    nullable: true,
    topics: ({args, payload}) => {
      const id = uuid();
      const plugin = App.plugins.systems.find(t => t.id === args.pluginId);
      const system = plugin?.systems.find(s => s.id === args.id);

      process.nextTick(() => {
        pubsub.publish(id, {
          id: args.id,
          pluginId: args.pluginId,
          system,
        });
      });
      return [id, "systemPluginSystem"];
    },
    filter: ({args, payload}) => {
      return args.id === payload.id && args.pluginId === payload.pluginId;
    },
  })
  systemPluginSystem(
    @Root() payload: {id: string; system: Entity},
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("id", type => ID) id: string
  ): Entity {
    return payload.system;
  }

  @Subscription(returns => [Entity], {
    topics: ({args, payload}) => {
      const id = uuid();
      const plugin = App.plugins.systems.find(t => t.id === args.pluginId);
      process.nextTick(() => {
        pubsub.publish(id, {
          pluginId: args.pluginId,
          systems: plugin?.systems,
        });
      });
      return [id, "systemPluginSystems"];
    },
    filter({args, payload}) {
      return args.pluginId === payload.pluginId;
    },
  })
  systemPluginSystems(
    @Root() payload: {systems: Entity[]},
    @Arg("pluginId", type => ID) pluginId: string
  ): Entity[] {
    return payload.systems || [];
  }
}
