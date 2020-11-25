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
export function createStationComplement({
  crewCount = 6,
  crewCaptain = true,
  ship,
  flightDirector = true,
}: {
  crewCount?: number;
  crewCaptain?: boolean;
  ship: Entity;
  flightDirector?: boolean;
}) {
  // No station set; lets create a new one.
  let stationCount = crewCount - (crewCaptain ? 1 : 0);
  // TODO: Finish this up.
  // This should take the following into account:
  //  - Whether the ship is configured to use the marauder's map
  //  - What ship systems are assigned to the ship
  const stationComplement = new StationComplementComponent({
    stations: [
      flightDirector &&
        new Station({
          name: "Flight Director",
          cards: [
            new Card({
              name: "Core",
              component: "Core",
            }),
          ],
        }),
      new Station({
        name: "Viewscreen",
        cards: [
          new Card({
            name: "Viewscreen",
            component: "Viewscreen",
          }),
        ],
      }),
      new Station({
        name: "Development",
        cards: [
          new Card({
            name: "Pilot",
            component: "Pilot",
          }),
        ],
      }),
    ].filter(function removeStation(
      station: boolean | Station
    ): station is Station {
      return Boolean(station);
    }),
  });
  return stationComplement;
}
