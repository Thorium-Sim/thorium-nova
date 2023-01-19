import {MetersPerSecond} from "server/src/utils/unitTypes";
import {Component} from "../utils";

/** This class represents entities that can move around a ship */
export class PassengerMovementComponent extends Component {
  static id = "passengerMovement" as const;

  /** TODO June 16, 2022 - Some day it should be possible to connect from one ship to another and have entities move between them. */
  destinationNode: number | null = null;
  nodePath: number[] = [];
  nextNodeIndex: number = 0;

  movementMaxVelocity: {
    x: MetersPerSecond;
    y: MetersPerSecond;
    z: MetersPerSecond;
  } = {
    x: 3,
    y: 3,
    z: 3 / 10, // The Z default is because decks are 10 meters high, so it should take 10x as long to move between decks.
  };
}
