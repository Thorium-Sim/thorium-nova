import {StationComplementComponent} from "server/components/stationComplement";
import {Card} from "server/schema/card";
import Station from "server/schema/station";

import Entity from "./ecs/entity";

const Pilot = new Station({
  name: "Pilot",
});
const stationNames = [
  ["Pilot"],
  ["Navigation", "Tactical"],
  ["Navigation", "Tactical", "Operations"],
  ["Navigation", "Tactical", "Operations", "Engineer"],
  ["Sensors", "Navigation", "Tactical", "Operations", "Engineer"],
  ["Command", "Sensors", "Navigation", "Tactical", "Operations", "Engineer"],
  [
    "Command",
    "Sensors",
    "Navigation",
    "Tactical",
    "Operations",
    "Engineer",
    "Communications",
  ],
  [
    "Command",
    "Sensors",
    "Navigation",
    "Tactical",
    "Operations",
    "Engineer",
    "Communications",
    "Science",
  ],
  [
    "Command",
    "Sensors",
    "Navigation",
    "Tactical",
    "Operations",
    "Engineer",
    "Communications",
    "Science",
    "Security",
  ],
  [
    "Command",
    "Sensors",
    "Navigation",
    "Tactical",
    "Operations",
    "Engineer",
    "Communications",
    "Science",
    "Security",
    "Maintenance",
  ],
  [
    "Command",
    "Sensors",
    "Navigation",
    "Tactical",
    "Operations",
    "Engineer",
    "Communications",
    "Science",
    "Security",
    "Maintenance",
    "Medical",
  ],
];
export function createStationComplement(
  crewCount: number = 6,
  crewCaptain: boolean = true,
  ship: Entity
) {
  // No station set; lets create a new one.
  let stationCount = crewCount - (crewCaptain ? 1 : 0);
  // TODO: Finish this up.
  // This should take the following into account:
  //  - Whether the ship is configured to use the marauder's map
  //  - What ship systems are assigned to the ship
  const stationComplement = new StationComplementComponent({
    stations: [
      new Station({
        name: "Development",
        cards: [
          new Card({
            name: "Pilot",
            component: "Pilot",
          }),
        ],
      }),
    ],
  });
  return stationComplement;
}
