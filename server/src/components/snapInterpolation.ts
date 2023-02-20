import {Component} from "./utils";

/**
 * Add this component to indicate an entity's animation should snap instead of interpolate
 * such as when a ship transitions from solar to interstellar space.
 */
export class SnapInterpolationComponent extends Component {
  static id: "snapInterpolation" = "snapInterpolation";
}
