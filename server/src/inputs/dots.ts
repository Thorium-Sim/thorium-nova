import {DataContext} from "../utils/DataContext";
import {Entity} from "../utils/ecs";
import {pubsub} from "../utils/pubsub";

export const dotsInputs = {
  dotCreate(context: DataContext) {
    for (let i = 0; i < 20; i++) {
      const entity = new Entity();
      entity.addComponent("position", {
        x: Math.random() * 200,
        y: Math.random() * 200,
        z: Math.random() * 200,
      });
      entity.addComponent("velocity", {x: 0, y: 0, z: 0});
      entity.addComponent("color", {
        color: `hsl(${Math.round(Math.random() * 360)},${
          Math.round(Math.random() * 20) + 80
        }%,${Math.round(Math.random() * 20) + 40}%)`,
      });
      entity.addComponent("rotation", {
        x: -0.27059805007309845,
        y: 0.6532814824381882,
        z: -0.6532814824381883,
        w: 0.2705980500730985,
      });
      context.flight?.ecs.addEntity(entity);
    }
    pubsub.publish("dots");
  },
};
