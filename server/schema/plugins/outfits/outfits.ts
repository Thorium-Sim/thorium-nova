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
import {IsOutfitComponent} from "server/components/outfits/isOutfit";
import {IdentityComponent} from "server/components/identity";
import {WarpEnginesComponent} from "server/components/outfits/warpEngines";
import {NavigationComponent} from "server/components/outfits/navigation";
import {JumpDriveComponent} from "server/components/outfits/jumpDrive";
import {ImpulseEnginesComponent} from "server/components/outfits/impulseEngines";
import {ThrustersComponent} from "server/components/outfits/thrusters";
import {DamageComponent} from "server/components/outfits/damage";
import {EfficiencyComponent} from "server/components/outfits/efficiency";
import {PowerComponent} from "server/components/outfits/power";
import {HeatComponent} from "server/components/heat";
import {Component} from "server/components/utils";
import Entity from "server/helpers/ecs/entity";
import uuid from "uniqid";
import {pubsub} from "server/helpers/pubsub";
import BasePlugin, {getPlugin, publish} from "../basePlugin";

enum OutfitAbilities {
  warpEngines,
  impulseEngines,
  thrusters,
  navigation,
  jumpDrive,
  generic,
}
registerEnumType(OutfitAbilities, {
  name: "OutfitAbilities",
});

function getOutfitComponents(
  ability: OutfitAbilities
): {component: Component; defaultValue?: any}[] {
  switch (ability) {
    case OutfitAbilities.warpEngines:
      return [
        {component: WarpEnginesComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
      ];
    case OutfitAbilities.impulseEngines:
      return [
        {component: ImpulseEnginesComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
      ];
    case OutfitAbilities.thrusters:
      return [
        {component: ThrustersComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
      ];
    case OutfitAbilities.navigation:
      return [
        {component: NavigationComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
      ];
    case OutfitAbilities.jumpDrive:
      return [
        {component: JumpDriveComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
      ];
    case OutfitAbilities.generic:
      return [{component: PowerComponent}, {component: DamageComponent}];
    default:
      return [];
  }
}

function outfitPublish({plugin, outfit}: {plugin: BasePlugin; outfit: Entity}) {
  publish(plugin);
  pubsub.publish("pluginOutfits", {
    pluginId: plugin.id,
    outfits: plugin.outfits,
  });
  pubsub.publish("pluginOutfit", {
    pluginId: plugin.id,
    id: outfit.id,
    outfit: outfit,
  });
}

@Resolver()
export class PluginOutfitResolver {
  @Query(returns => [Entity], {name: "pluginOutfits"})
  pluginOutfitsQuery(@Arg("pluginId", type => ID) pluginId: string): Entity[] {
    const plugin = getPlugin(pluginId);
    return plugin.outfits;
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
  @Mutation()
  pluginAddOutfit(
    @Arg("pluginId", type => ID)
    pluginId: string,
    @Arg("name")
    name: string,
    @Arg("ability", type => OutfitAbilities)
    ability: OutfitAbilities
  ): Entity {
    const plugin = getPlugin(pluginId);
    if (plugin.outfits.find(s => s.identity?.name === name)) {
      throw new Error("An outfit with that name already exists.");
    }

    const components = getOutfitComponents(ability);
    const entity = new Entity(null, [
      IdentityComponent,
      TagsComponent,
      IsOutfitComponent,
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

    plugin.outfits.push(entity);

    outfitPublish({plugin, outfit: entity});
    return entity;
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
