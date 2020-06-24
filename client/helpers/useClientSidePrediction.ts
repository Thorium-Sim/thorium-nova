import React from "react";
import {StoreApi} from "zustand";
import {TSubscriptionResponse} from "./graphqlHooks";
import {World, System} from "ecsy";
import Position from "shared/components/Position";
import Velocity from "shared/components/Velocity";
import Acceleration from "shared/components/Acceleration";
import Movement from "shared/systems/Movement";
import useAnimationFrame from "./useAnimationFrame";

const components: {[key: string]: any} = {
  Position: Position,
  Velocity: Velocity,
  Acceleration: Acceleration,
};

type ECSStore = StoreApi<TSubscriptionResponse<any>>;
class StoreUpdate extends System {
  static queries = {
    entities: {
      components: [Position],
    },
  };
  storeApi!: ECSStore;
  init({storeApi}: {storeApi: ECSStore}) {
    this.storeApi = storeApi;
  }
  execute() {
    const gameState = this.queries.entities.results.map(e => {
      return {
        id: String(e.id),
        // @ts-ignore
        name: e.name,
        ...e.getComponents(),
      };
    });
    this.storeApi.setState(state => ({
      ...state,
      data: {...state.data, gameState},
    }));
  }
}

// TODO: Still needs to implement updating existing entities and removing entities
// Updating entities should include drifting existing entity values to their real
// values, with the option to do a jump when the server value is too different from
// the client value. This should be tunable on a component-by-component basis. EG.
// position movement is smooth, but velocity movement always jumps.

export function useClientSidePrediction(
  storeApi: ECSStore,
  entityKey: string = "objects",
) {
  // Create a world and add all the components and systems
  const [world] = React.useState(new World());

  React.useEffect(() => {
    world
      .registerComponent(Position)
      .registerComponent(Velocity)
      .registerComponent(Acceleration)
      .registerSystem(Movement)
      .registerSystem(StoreUpdate, {storeApi: storeApi});
  }, [world]);

  useAnimationFrame(delta => {
    world.execute(delta, 0);
  });

  React.useEffect(() => {
    const unSub = storeApi.subscribe(
      (state: TSubscriptionResponse<{[key: string]: any[]}> | null) => {
        const gameObjects = state?.data?.[entityKey] || [];
        const gameState = state?.data?.gameState || [];
        // Create our entity lists
        const newEntities = gameObjects.filter(
          s => !gameState.find(g => s.name === g.name),
        );
        const updateEntities = gameObjects.filter(s =>
          gameState.find(g => s.name === g.name),
        );
        const removeEntities = gameState.filter(
          g => !gameObjects.find(s => s.name === g.name),
        );

        newEntities.forEach(e => {
          const entity = world.createEntity(e.name);
          // Components begin with uppercase letters
          const entityComps = Object.keys(e).filter(
            g => g[0] === g[0].toUpperCase(),
          );
          entityComps.forEach(componentName => {
            entity.addComponent(components[componentName]);
            const comp: {[key: string]: any} = entity.getMutableComponent(
              components[componentName],
            );
            Object.entries(e[componentName]).forEach(([key, value]) => {
              comp[key] = value;
            });
          });
        });
      },
    );
    return () => unSub();
  }, [storeApi]);
}
