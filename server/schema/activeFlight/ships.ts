import Entity from "server/helpers/ecs/entity";
import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Mutation,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import uuid from "uniqid";
import {pubsub} from "server/helpers/pubsub";
import App from "server/app";
import {getShip, shipPublish} from "../plugins/ship/utils";
import {IsShipComponent} from "server/components/isShip";
import {ShipAssetsComponent} from "server/components/ship/shipAssets";
import {TagsComponent} from "server/components/tags";
import {IdentityComponent} from "server/components/identity";
import {ThemeComponent} from "server/components/theme";
import {PositionComponent} from "server/components/position";
import {VelocityComponent} from "server/components/velocity";
import {RotationVelocityComponent} from "server/components/rotationVelocity";
import {ShipOutfitsComponent} from "server/components/ship/shipOutfits";
import {InterstellarPositionComponent} from "server/components/ship/interstellarPosition";
import {SizeComponent} from "server/components/size";
import {AlertLevelComponent} from "server/components/ship/alertLevel";
import {AutopilotComponent} from "server/components/ship/autopilot";
import {Coordinates} from "server/components/Coordinates";
import {IsOutfitComponent} from "server/components/outfits/isOutfit";
import {RotationComponent} from "server/components/rotation";
import {getAnyOutfit} from "../plugins/outfits/utils";

@Resolver()
export class ActiveShipsResolver {
  @Subscription(returns => [Entity], {
    topics: ({args, payload}) => {
      const id = uuid();
      const ships = App.activeFlight?.ecs.entities.filter(
        e => e?.isShip && e?.interstellarPosition?.systemId === args.systemId
      );
      process.nextTick(() => {
        pubsub.publish(id, {
          id: args.systemId,
          ships,
        });
      });
      return [id, "universeSystem"];
    },
    filter: ({args, payload}) => {
      if (args.systemId !== payload.id) return false;
      return true;
    },
    description:
      "Only provides subscription updates when a ship enters or leaves a system.",
  })
  universeSystemShips(
    @Root() payload: {id: string; ships: Entity[]},
    @Arg("systemId", type => ID) id: string
  ): Entity[] {
    return payload.ships;
  }
  @Subscription(returns => [Entity], {
    topics: ({args, payload}) => {
      const id = uuid();
      const ships = App.activeFlight?.ecs.entities.filter(
        e => e?.isShip && e?.interstellarPosition?.systemId === args.systemId
      );
      process.nextTick(() => {
        pubsub.publish(id, {
          id: args.systemId,
          ships,
        });
      });
      return [id, "universeSystemShipsHot"];
    },
    filter: ({args, payload}) => {
      if (args.systemId !== payload.id) return false;
      return true;
    },
    description:
      "Provides subscription updates at a much faster rate than the universeSystemsShips subscription.",
  })
  universeSystemShipsHot(
    @Root() payload: {id: string; ships: Entity[]},
    @Arg("systemId", type => ID) id: string
  ): Entity[] {
    return payload.ships;
  }
  @Mutation(returns => Entity, {nullable: true})
  shipSpawn(
    @Arg("templateId", type => ID) templateId: string,
    @Arg("systemId", type => ID) systemId: string,
    @Arg("position", type => Coordinates) position: Coordinates
  ): Entity | null {
    if (!App.activeFlight) return null;
    const {ship: shipTemplate} = getShip({shipId: templateId});

    const entity = new Entity(null, [
      IsShipComponent,
      AlertLevelComponent,
      ShipAssetsComponent,
      TagsComponent,
      IdentityComponent,
      ThemeComponent,
      SizeComponent,
      PositionComponent,
      RotationComponent,
      InterstellarPositionComponent,
      AutopilotComponent,
      VelocityComponent,
      RotationVelocityComponent,
      ShipOutfitsComponent,
    ]);

    entity.pluginId = shipTemplate.pluginId;

    // TODO: Randomly generate a name for this ship based on the assigned faction.
    entity.updateComponents(
      shipTemplate.components as Record<string, Record<string, any>>
    );

    App.activeFlight.ecs.addEntity(entity);
    // Generate all of the outfits for this ship
    const outfitIds = shipTemplate.components.shipOutfits?.outfitIds.map(o => {
      const outfit = new Entity(null, [
        IsOutfitComponent,
        IdentityComponent,
        TagsComponent,
      ]);
      const templateOutfit = getAnyOutfit(o);
      outfit.pluginId = templateOutfit.pluginId;
      outfit.updateComponents(
        templateOutfit.components as Record<string, Record<string, any>>
      );
      outfit.updateComponent("shipAssignment", {shipId: entity.id});
      App.activeFlight?.ecs.addEntity(outfit);
      return outfit.id;
    });
    entity.updateComponent("shipOutfits", {outfitIds});
    entity.updateComponent("interstellarPosition", {systemId});
    entity.updateComponent("position", position);
    shipPublish({ship: entity});
    return entity;
  }
}

@Resolver(of => InterstellarPositionComponent)
export class InterstellarPositionComponentResolver {
  @FieldResolver(type => Entity, {nullable: true})
  system(@Root() self: InterstellarPositionComponent) {
    const item =
      App.activeFlight?.ecs.entities.find(s => s.id === self.systemId) || null;
    return item;
  }
}
