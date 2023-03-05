import {Entity, System} from "../utils/ecs";

/**
 * There's a lot to weight with how power is distributed.
 * First, there's the double-connection between reactors and power nodes.
 * A power node might be connected to multiple reactors, and each reactor
 * could be connected to multiple power nodes.
 *
 * Also, there's the issue of batteries, which shouldn't be charged until
 * all of the power nodes connected to a reactor have been supplied all
 * the power they need, but also reactors attached to a battery should be
 * weighted less than other reactors to provide more of an opportunity for
 * the batteries to be charged, at the expense of having a different reactor
 * not connected to the battery generate more power to fulfill the power
 * node requirements.
 *
 * This algorithm should be efficient, which means as little looping as possible.
 */

export class PowerGridSystem extends System {
  test(entity: Entity) {
    return !!entity.components.isShip;
  }
  update(entity: Entity, elapsed: number) {
    const elapsedTimeHours = elapsed / 1000 / 60 / 60;
    let poweredSystems: Entity[] = [];
    let reactors: Entity[] = [];
    let batteries: Entity[] = [];
    let powerNodes: Entity[] = [];

    const systemIds = entity.components.shipSystems?.shipSystems.keys() || [];
    for (let sysId of systemIds) {
      const sys = this.ecs.getEntityById(sysId);
      if (sys?.components.isReactor) reactors.push(sys);
      else if (sys?.components.isBattery) batteries.push(sys);
      else if (sys?.components.isPowerNode) powerNodes.push(sys);
      else if (sys?.components.isShipSystem && sys.components.power)
        poweredSystems.push(sys);
    }

    // First, figure out how much power each power node is requesting
    const nodeRequestedPower = new Map<number, number>();
    for (let node of powerNodes) {
      let nodePower = 0;
      for (let systemId of node.components.isPowerNode?.connectedSystems ||
        []) {
        const system = poweredSystems.find(s => s.id === systemId);
        nodePower += system?.components.power?.powerDraw || 0;
      }
      nodeRequestedPower.set(node.id, nodePower);
    }

    // Sort reactors based on whether they are connected to batteries,
    // and how many power nodes they are connected to.
    reactors.sort((a, b) => {
      if (!a.components.isReactor) return -1;
      if (!b.components.isReactor) return 1;
      const aBatteries = a.components.isReactor?.connectedEntities.filter(id =>
        batteries.find(b => b.id === id)
      ).length;
      const bBatteries = b.components.isReactor?.connectedEntities.filter(id =>
        batteries.find(b => b.id === id)
      ).length;
      if (aBatteries > bBatteries) return -1;
      if (bBatteries > aBatteries) return 1;

      return (
        a.components.isReactor?.connectedEntities.length -
        b.components.isReactor?.connectedEntities.length
      );
    });
    // Supply reactor power to the power nodes,
    // but only up to their requested power level
    const nodeSuppliedPower = new Map<number, number>();
    const batterySuppliedPower = new Map<number, number>();
    for (let reactor of reactors) {
      if (!reactor.components.isReactor) continue;
      if (reactor.components.isReactor.connectedEntities.length === 0) continue;

      // Convert the total power output to the instantaneous output by dividing it by one hour
      let totalPower = reactor.components.isReactor.currentOutput;

      // Distribute power to power nodes first
      const reactorNodes = reactor.components.isReactor.connectedEntities
        .map(id => {
          const powerNode = powerNodes.find(node => node.id === id);
          if (!powerNode) return null;
          return {
            id: powerNode.id,
            requestedPower: Math.max(
              0,
              (nodeRequestedPower.get(id) || 0) -
                (nodeSuppliedPower.get(id) || 0)
            ),
          };
        })
        .filter(Boolean) as {id: number; requestedPower: number}[];

      reactorNodes.sort((a, b) => {
        return a.requestedPower - b.requestedPower;
      });
      while (totalPower > 0) {
        let powerSplit = totalPower / reactorNodes.length;

        const leastNode = reactorNodes[0];

        if (!leastNode) break;

        // The least node doesn't need it's allotment of power, so let's
        // give it all that it's asking for and split the rest among
        // the other nodes
        if (leastNode.requestedPower < powerSplit) {
          reactorNodes.forEach(node => {
            const currentPower = nodeSuppliedPower.get(node.id) || 0;
            totalPower -= leastNode.requestedPower;
            nodeSuppliedPower.set(
              node.id,
              leastNode.requestedPower + currentPower
            );
          });
          reactorNodes.shift();
          continue;
        }

        // There isn't enough power for all the nodes
        // to get all that they want from this reactor
        // so we'll give them all it can give.
        reactorNodes.forEach(node => {
          const currentPower = nodeSuppliedPower.get(node.id) || 0;
          nodeSuppliedPower.set(node.id, currentPower + powerSplit);
          totalPower -= powerSplit;
        });
        break;
      }

      // Is there power left over? Charge up the batteries
      const reactorBatteries = reactor.components.isReactor.connectedEntities
        .map(id => {
          const battery = batteries.find(node => node.id === id);
          if (!battery?.components.isBattery) return null;
          const chargeCapacity =
            (battery.components.isBattery?.chargeRate || 0) -
            (batterySuppliedPower.get(id) || 0);
          return {
            id: battery.id,
            requestedPower: Math.max(0, chargeCapacity),
          };
        })
        .filter(Boolean) as {id: number; requestedPower: number}[];

      reactorBatteries.sort((a, b) => {
        return a.requestedPower - b.requestedPower;
      });

      while (totalPower > 0) {
        let powerSplit = totalPower / reactorBatteries.length;

        const leastBattery = reactorBatteries[0];

        if (!leastBattery) break;

        // The least node doesn't need it's allotment of power, so let's
        // give it all that it's asking for and split the rest among
        // the other nodes
        if (leastBattery.requestedPower < powerSplit) {
          reactorBatteries.forEach(battery => {
            const currentPower = batterySuppliedPower.get(battery.id) || 0;

            totalPower -= leastBattery.requestedPower;
            batterySuppliedPower.set(
              battery.id,
              leastBattery.requestedPower + currentPower
            );
          });
          reactorBatteries.shift();
          continue;
        }

        // There isn't enough power for all the batteries
        // to get all that they want from this reactor
        // so we'll give them all it can give.
        reactorBatteries.forEach(node => {
          const currentPower = batterySuppliedPower.get(node.id) || 0;
          batterySuppliedPower.set(node.id, currentPower + powerSplit);
        });
        break;
      }
    }

    // Now apply the battery power levels
    batterySuppliedPower.forEach((value, key) => {
      const battery = batteries.find(node => node.id === key);
      const capacity = battery?.components.isBattery?.capacity || 0;
      const storage = battery?.components.isBattery?.storage || 0;
      const limit = battery?.components.isBattery?.chargeRate || Infinity;
      battery?.updateComponent("isBattery", {
        storage: Math.min(
          capacity,
          storage + Math.min(value, limit) * elapsedTimeHours
        ),
      });
    });

    // Distribute the power node power to all of the connected systems
    nodeSuppliedPower.forEach((value, key) => {
      const node = powerNodes.find(node => node.id === key);
      if (value < (nodeRequestedPower.get(key) || 0)) {
        // If a power node doesn't have sufficient power,
        // draw that power from batteries
        const connectedBatteries = batteries.filter(b =>
          b.components.isBattery?.connectedNodes.includes(key)
        );
        let excessDemand = (nodeRequestedPower.get(key) || 0) - value;
        connectedBatteries.forEach(battery => {
          const limit = battery.components.isBattery?.dischargeRate || Infinity;
          const storage = battery.components.isBattery?.storage || 0;
          const powerDraw = Math.min(limit, excessDemand) * elapsedTimeHours;
          if (storage > powerDraw) {
            battery.updateComponent("isBattery", {
              storage: Math.max(0, storage - powerDraw),
            });
            excessDemand = 0;
            value = nodeRequestedPower.get(key) || 0;
          } else {
            excessDemand -= storage / elapsedTimeHours;
            value += storage / elapsedTimeHours;
            battery.updateComponent("isBattery", {storage: 0});
          }
        });
      }
      // Distribute all of the power to systems based on the power node's distribution scheme
      const connectedSystems = poweredSystems.filter(sys =>
        node?.components.isPowerNode?.connectedSystems.includes(sys.id)
      );
      const distributionMode =
        node?.components.isPowerNode?.distributionMode || "evenly";

      connectedSystems.sort((a, b) => {
        if (distributionMode === "mostFirst") {
          return (
            (b.components.power?.powerDraw || 0) -
            (a.components.power?.powerDraw || 0)
          );
        } else {
          return (
            (a.components.power?.powerDraw || 0) -
            (b.components.power?.powerDraw || 0)
          );
        }
      });
      if (distributionMode === "evenly") {
        connectedSystems.forEach(entity => {
          entity.updateComponent("power", {currentPower: 0});
        });

        while (value > 0) {
          let powerSplit = value / connectedSystems.length;
          const leastPowerRequired = connectedSystems[0];
          if (!leastPowerRequired) break;

          // The system with the least power need doesn't need it's allotment of power, so let's
          // give it all that it's trying to pull and split the rest among the other systems
          const requestedPower =
            leastPowerRequired.components.power?.powerDraw || 0;

          if (requestedPower < powerSplit) {
            connectedSystems.forEach(entity => {
              value -= requestedPower;
              const currentPower = entity.components.power?.currentPower || 0;
              const sysRequestedPower = entity.components.power?.powerDraw || 0;
              entity.updateComponent("power", {
                currentPower: Math.min(
                  sysRequestedPower,
                  requestedPower + currentPower
                ),
              });
            });
            connectedSystems.shift();
            continue;
          }
          // There isn't enough power for all the systems
          // to get all that they want from this node
          // so we'll give them all it can give.
          connectedSystems.forEach(system => {
            const currentPower = system.components.power?.currentPower || 0;
            const requestedPower = system.components.power?.powerDraw || 0;
            system.updateComponent("power", {
              currentPower: Math.min(requestedPower, powerSplit + currentPower),
            });
          });
          break;
        }
      } else {
        connectedSystems.forEach(system => {
          let powerDraw = Math.min(
            system.components.power?.powerDraw || 0,
            value
          );
          if (powerDraw < 0) powerDraw = 0;
          system.updateComponent("power", {currentPower: powerDraw});
          value -= powerDraw;
        });
      }
    });
  }
}
