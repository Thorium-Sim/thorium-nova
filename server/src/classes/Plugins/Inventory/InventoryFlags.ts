import {PowerUnit} from "server/src/utils/unitTypes";

/**
 * Jumping the gun a bit of this, but I figure it's helpful to have context
 * for how inventory flags work. These repair types came from Thorium Classic.
 **/

export type RepairTypes =
  | "Computer Specialist"
  | "Custodian"
  | "Quality Assurance"
  | "Electrician"
  | "Explosive Expert"
  | "Fire Control"
  | "General Engineer"
  | "Hazardous Waste"
  | "Mechanic"
  | "Plumber"
  | "Structural Engineer"
  | "Welder"
  | null;

export type InventoryFlags = Partial<{
  fuel: {
    /** How much power is released from one unit of fuel */
    fuelDensity: PowerUnit;
  };
  coolant: {};
  // TODO July 1, 2022 - Could be interesting to put torpedo movement properties on the torpedo casing. Max speed, acceleration, turn speed, etc.
  torpedoCasing: {};
  // TODO July 1, 2022 - Put the damage yield, and perhaps the damage type, here.
  torpedoWarhead: {};
  probeCasing: {};
  probeEquipment: {};
  forCrew: {};
  science: {};
  // TODO July 1, 2022 - Individual inventory items could be used to heal different kinds of ailments,
  // like poison, radiation, etc. and those can be noted here.
  medical: {};
  security: {};
  repair: {
    /** The type of repair team that this item is used by. */
    type: RepairTypes;
  };
  sparePart: {
    /** Tags to indicate the systems the spare part is used to repair. If left blank it can be used with all systems */
    systemTags: string[];
  };
  water: {};
}>;

export const InventoryFlagValues: {
  [P in keyof InventoryFlags]: {
    [O in keyof NonNullable<InventoryFlags[P]>]: {
      defaultValue: NonNullable<InventoryFlags[P]>[O];
      info: string;
    };
  } & {info: string};
} = {
  fuel: {
    info: "Used by the reactor to generate power.",
    fuelDensity: {
      defaultValue: 1,
      info: "How much power is released from one unit of fuel.",
    },
  },
  coolant: {
    info: "Cools down things that get hot, like the reactor, engines, and weapons.",
  },
  forCrew: {info: "Indicates that this item can be equipped by a crew member."},
  science: {
    info: "Useful for scientific experiments. Mostly just helps assign the item to a room when spawning a ship.",
  },
  medical: {
    info: "Used in the sickbay and by medical teams to heal crew members.",
  },
  security: {info: "Used by security teams to protect the ship."},
  repair: {
    info: "Used by repair teams to repair damaged systems.",
    type: {
      defaultValue: "General Engineer",
      info: "The type of repair team that this item is used by.",
    },
  },
  sparePart: {
    info: "Used by repair teams to repair damaged systems.",
    systemTags: {
      defaultValue: [],
      info: "Tags to indicate the systems the spare part is used to repair. If left blank it can be used with all systems",
    },
  },
  torpedoCasing: {
    info: "Necessary to launch torpedos. Warheads are loaded into the casing before firing.",
  },
  torpedoWarhead: {
    info: "What inflicts the damage. Warheads are loaded into the casing before firing.",
  },
  probeCasing: {info: "Necessary to launch probes."},
  probeEquipment: {info: "Used by the probe to carry equipment."},
};
