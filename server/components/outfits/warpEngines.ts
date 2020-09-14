import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "../utils";

@ObjectType()
export class WarpEnginesComponent extends Component {
  static id: "warpEngines" = "warpEngines";
  static defaults: ComponentOmit<WarpEnginesComponent> = {
    interstellarCruisingSpeed: 599600000000,
    planetaryCruisingSpeed: 29980000,
    minSpeedMultiplier: 0.01,
    warpFactorCount: 5,
    currentWarpFactor: 0,
    forwardVelocity: 0,
  };

  @Field({description: "The cruising speed in interstellar space in km/s"})
  interstellarCruisingSpeed: number = 599600000000;
  @Field({description: "The cruising speed in planetary system space in km/s"})
  planetaryCruisingSpeed: number = 29980000;
  @Field({description: "The min speed (warp 1) compared to the cruising speed"})
  minSpeedMultiplier: number = 0.01;
  @Field({
    description:
      "How many warp factors there are between min and max inclusive. This does not include emergency or destructive warp which are automatically extrapolated.",
  })
  warpFactorCount: number = 5;

  @Field({description: "The current warp factor. 0 is full stop."})
  currentWarpFactor: number = 0;

  @Field({description: "The forward velocity of the ship in km/s."})
  forwardVelocity: number = 0;

  // Stuff for spooling
  // TODO: Figure this out once the power distribution system is in place.
}
/**
 * Factors in warp drive use
 * - All warp drives are limited by the gravity in solar systems, so they automatically go slower.
 * - All warp drives go the same speed at the same warp factor, and all ships are capable of going
 *   the same warp factors;
 * - Cruising speed (warp 5) is 5.996×10^11 km/s, or 2000000c. This enables travel from one end of
 *   the known universe to the other in about 8 hours, and provides reasonable speeds for local
 *   interstellar travel (2.6 minutes to travel 10 ly, 10.5 minutes to travel 40 ly)
 * - Cruising speed in a solar system (still warp 5) is 2.998*10^7 km/s or 100c. This allows travel from
 *   the sun to Neptune (the outer edges of the solar system) in 2.5 minutes.
 * - Warp 1 is 1/100 cruising speed. All of the warp factors between grow linearly from there.
 * - Traveling for long periods of time (> 7 minutes) at cruising speed should be uncomfortable from a
 *   heat/coolant and fuel perspective.
 * - One step above cruising speed is emergency warp, and a final "destructive warp" after that.
 * - Energy consumption and heat levels increase exponentially. This is to
 *   discourage going at high speeds for long time periods. Higher speeds should only be used for
 *   intercept courses and catching up with other ships.
 * - Conversely, going at lower speeds would have virtually no energy consumption (outside of the surge
 *   needed for the initial jump) and produce little heat, but would take a very long time to get anywhere.
 * - To jump to warp speed in any circumstance, the warp engines have to be "spooled". A
 *   Compensated Pulsed Dynamo, or just "Dynamo", charges up a massive flywheel which is then engaged
 *   when the ship is to jump to warp. To charge up enough energy to jump to Warp 1 should take at least 30
 *   seconds (although play testing can clear up how long it really should be).
 * - After the engine is spooled to Warp 1, or if the ship is already traveling at warp speed, subsequent
 *   spooling should only take 5 seconds per warp speed
 * - Warp Engines can only be activated if the ship is at full stop. Spooling can happen at any time.
 * - Spooling the engines creates more heat than having the engines active to discourage keeping the engines
 *   spooled all the time. Spool heat decreases slowly when the engines are deactivated.
 */
