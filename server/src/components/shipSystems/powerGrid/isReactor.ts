import {MegaWatt, MegaWattHour} from "@server/utils/unitTypes";
import {Component} from "../../utils";

export class IsReactorComponent extends Component {
  static id = "isReactor" as const;

  /**
   * The power nodes and batteries that are associated with this reactor
   */
  connectedEntities: number[] = [];

  /**
   * This will be set when the ship is spawned
   * based on the total power required
   * to run all systems divided by the number of
   * reactors in the ship
   */
  maxOutput: MegaWatt = 120;
  /**
   * What percent of the max output provides a 100% fuel-to-energy conversion.
   * Any higher output than this decreases overall efficiency,
   * any lower increases overall efficiency, making fuel last longer.
   */
  optimalOutputPercent: number = 0.7;
  /**
   * The desired output specified by the crew member;
   */
  desiredOutput: MegaWatt = 84;
  /**
   * What the reactor is currently outputting, updated by the power ECS System.
   * It will always be less than or equal to the desired output, never more.
   */
  currentOutput: MegaWatt = 84;
  /**
   * How much fuel is left to burn after the previous tick. Fuel is only removed
   * from inventory in whole units. Any fuel not turned into power remains in the
   * reactor.
   */
  unusedFuel: {amount: number; density: MegaWattHour} = {amount: 0, density: 1};
}
