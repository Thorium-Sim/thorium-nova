import Entity from "server/helpers/ecs/entity";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  ID,
  InputType,
  Mutation,
  Query,
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
import {getPhrase, parsePhrase} from "../phrases";
import cloneDeep from "lodash/cloneDeep";
import {GraphQLContext} from "server/helpers/graphqlContext";
import rng from "rng";
import {distance3d} from "server/helpers/distance3d";

type FauxECS = {addEntity: (e: Entity) => void} | undefined;
export function shipSpawn(
  templateId: string,
  systemId: string,
  position: Coordinates,
  ecs: FauxECS = App.activeFlight?.ecs,
  name?: string
) {
  if (!ecs) return null;
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
  let shipName = `${shipTemplate.identity?.name || ""} ${Math.round(
    Math.random() * 1000000
  )}`;
  if (name) {
    shipName = name;
  } else {
    if (shipTemplate.isShip?.nameGeneratorPhrase) {
      const phrase = getPhrase(shipTemplate.isShip.nameGeneratorPhrase);
      shipName = parsePhrase(phrase);
    }
  }

  const shipClass = entity.identity?.name;
  const registryPrefix = entity.isShip?.registry || "";
  const registryRng = new rng.MT(shipName);
  const registry = registryPrefix
    ? `${registryPrefix}${registryRng.range(1000, 9999)}`
    : "";
  entity.updateComponent("identity", {name: shipName});
  entity.updateComponent("isShip", {shipClass, registry});
  entity.updateComponent("factionAssignment", {
    factionId: shipTemplate.factionAssignment?.factionId,
  });
  entity.updateComponents(
    shipTemplate.components as Record<string, Record<string, any>>
  );

  ecs.addEntity(entity);
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
      cloneDeep(
        templateOutfit.components as Record<string, Record<string, any>>
      )
    );
    outfit.updateComponent("shipAssignment", {shipId: entity.id});
    ecs.addEntity(outfit);
    return outfit.id;
  });
  entity.updateComponent("shipOutfits", {outfitIds});
  entity.updateComponent("interstellarPosition", {systemId});
  entity.updateComponent("position", position);
  shipPublish({ship: entity});
  return entity;
}
@Resolver()
export class ActiveShipsResolver {
  @Query(returns => Entity, {name: "playerShip", nullable: true})
  playerShipQuery(@Ctx() context: GraphQLContext) {
    const ship = App.activeFlight?.ecs.entities.find(
      s => s.id === context.client?.shipId
    );
    return ship;
  }
  @Subscription(returns => Entity, {
    topics: ({context}: {context: GraphQLContext}) => {
      const id = uuid();
      const ship = App.activeFlight?.ecs.entities.find(
        s => s.id === context.client?.shipId
      );
      if (ship) {
        process.nextTick(() => {
          pubsub.publish(id, {
            shipId: ship.id,
            ship,
          });
        });
      }
      return [id, "playerShip"];
    },
    filter: ({
      context,
      payload,
    }: {
      context: GraphQLContext;
      payload: {shipId: string};
    }) => {
      if (context.client?.shipId !== payload.shipId) return false;
      return true;
    },
    description: "Provides subscription updates for a player ship.",
  })
  playerShip(
    @Root() payload: {id: string; ship: Entity},
    @Ctx() context: GraphQLContext
  ): Entity {
    return payload.ship;
  }

  @Subscription(returns => Entity, {
    topics: ({context}: {context: GraphQLContext}) => {
      const id = uuid();
      const ship = App.activeFlight?.ecs.entities.find(
        s => s.id === context.client?.shipId
      );
      if (ship) {
        process.nextTick(() => {
          pubsub.publish(id, {
            shipId: ship.id,
            ship,
          });
        });
      }
      return [id, "playerShipHot"];
    },
    filter: ({
      context,
      payload,
    }: {
      context: GraphQLContext;
      payload: {shipId: string};
    }) => {
      if (context.client?.shipId !== payload.shipId) return false;
      return true;
    },
    description:
      "Provides more frequent subscription updates for a player ship.",
  })
  playerShipHot(
    @Root() payload: {id: string; ship: Entity},
    @Ctx() context: GraphQLContext
  ): Entity {
    return payload.ship;
  }
  @Subscription(returns => [Entity], {
    topics: ({args, payload}) => {
      const id = uuid();
      const ships = App.activeFlight?.ecs.entities.filter(
        e => e?.isShip && e?.interstellarPosition?.systemId === args.systemId
      );
      process.nextTick(() => {
        pubsub.publish(id, {
          systemId: args.systemId,
          ships,
        });
      });
      return [id, "universeSystemShips"];
    },
    filter: ({args, payload}) => {
      if (args.systemId !== payload.systemId) return false;
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
          systemId: args.systemId,
          ships,
        });
      });
      return [id, "universeSystemShipsHot"];
    },
    filter: ({args, payload}) => {
      if (args.systemId !== payload.systemId) return false;
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
  @Subscription(returns => [Entity], {
    topics: ({args, payload, context}) => {
      const id = uuid();
      const shipId = args.shipId || context.client?.shipId;

      process.nextTick(() => {
        pubsub.publish(id, {
          shipId,
        });
      });
      return [id, "universeInterstellarShipsHot"];
    },
    filter: ({args, payload, context}) => {
      const shipId = args.shipId || context.client?.shipId;

      if (shipId !== payload.shipId) return false;
      return true;
    },
    description: "Provides high-rate updates for ships in interstellar space.",
  })
  universeInterstellarShipsHot(
    @Root() payload: {id: string; ships: Entity[]},
    @Arg("shipId", type => ID, {nullable: true}) shipIdArg: string,
    // TODO: Have this be the sensor range of the ship
    @Arg("radius", type => Number, {nullable: true}) radius: number = 0.1,
    @Ctx() context: GraphQLContext
  ): Entity[] {
    const shipId = shipIdArg || context.client?.shipId;
    const ship = App.activeFlight?.ecs.entities.find(s => s.id === shipId);
    const ships =
      App.activeFlight?.ecs.entities.filter(
        e =>
          e?.isShip &&
          !e?.interstellarPosition?.systemId &&
          e.position &&
          ship?.position &&
          distance3d(e.position, ship.position) <= radius
      ) || [];
    return ships;
  }
  @Mutation(returns => Entity, {nullable: true})
  shipSpawn(
    @Arg("templateId", type => ID) templateId: string,
    @Arg("systemId", type => ID) systemId: string,
    @Arg("position", type => Coordinates) position: Coordinates
  ): Entity | null {
    return shipSpawn(templateId, systemId, position);
  }
  @Mutation(returns => [Entity], {nullable: true})
  shipsSetPosition(
    @Arg("shipPositions", type => [ShipPosition]) shipPositions: ShipPosition[]
  ) {
    const ships = shipPositions.map(({id, position}) => {
      const {ship} = getShip({shipId: id});
      ship.updateComponent("position", position);
      return ship;
    });
    shipPublish({ship: ships[0]});
    return ships;
  }
  @Mutation(returns => [Entity], {nullable: true})
  shipsSetDesiredDestination(
    @Arg("shipPositions", type => [ShipPosition]) shipPositions: ShipPosition[]
  ) {
    const ships = shipPositions.map(({id, position}) => {
      const {ship} = getShip({shipId: id});
      ship.updateComponent("autopilot", {desiredCoordinates: position});
      return ship;
    });
    shipPublish({ship: ships[0]});
    return ships;
  }
}

@InputType()
class ShipPosition {
  @Field(type => ID)
  id!: string;
  @Field(type => Coordinates)
  position!: Coordinates;
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
