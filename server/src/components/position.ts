import {Component} from "./utils";

/**
 * Represents positions in interstellar and solar space,
 * as well as the position of entities within a ship.
 *
 * Using a single position component makes it easier to send
 * high-frequency updates with snapshot interpolation.
 *
 * Interstellar: LightMinute
 * Solar: Kilometer
 * Ship: Meter
 */
export class PositionComponent extends Component {
  static id: "position" = "position";

  /** If the type is solar, the ID of the solar system entity; if ship, the ID of the ship entity */
  parentId: number | null = null;
  type: "interstellar" | "solar" | "ship" = "interstellar";

  x: number = 0;
  y: number = 0;
  z: number = 0;
}
