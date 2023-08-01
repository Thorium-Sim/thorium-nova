import z from "zod";

import {
  HeatCapacity,
  Kilograms,
  KiloWattHour,
  MegaWattHour,
} from "server/src/utils/unitTypes";

/**
 * Jumping the gun a bit of this, but I figure it's helpful to have context
 * for how inventory flags work. These repair types came from Thorium Classic.
 **/

export type RepairTypes = z.infer<typeof repairTypes>;

const repairTypes = z.union([
  z.literal("Computer Specialist"),
  z.literal("Custodian"),
  z.literal("Quality Assurance"),
  z.literal("Electrician"),
  z.literal("Explosive Expert"),
  z.literal("Fire Control"),
  z.literal("General Engineer"),
  z.literal("Hazardous Waste"),
  z.literal("Mechanic"),
  z.literal("Plumber"),
  z.literal("Structural Engineer"),
  z.literal("Welder"),
  z.null(),
]);

// Turn the type above into a zod schema.
export const inventoryFlags = z
  .object({
    fuel: z
      .object({
        /** How much power is released from one unit of fuel in Megawatt Hours */
        fuelDensity: z.number().default(1),
      })
      .optional(),
    coolant: z
      .object({
        // HeatCapacity
        heatCapacity: z.number().default(4.18),
        // Kilograms
        massPerUnit: z.number().default(1000),
      })
      .optional(),
    // TODO July 1, 2022 - Could be interesting to put torpedo movement properties on the torpedo casing. Max speed, acceleration, turn speed, etc.
    torpedoCasing: z.object({}).optional(),
    // TODO July 1, 2022 - Put the damage yield, and perhaps the damage type, here.
    torpedoWarhead: z.object({}).optional(),
    probeCasing: z.object({}).optional(),
    probeEquipment: z.object({}).optional(),
    forCrew: z.object({}).optional(),
    science: z.object({}).optional(),
    // TODO July 1, 2022 - Individual inventory items could be used to heal different kinds of ailments,
    // like poison, radiation, etc. and those can be noted here.
    medical: z.object({}).optional(),
    security: z.object({}).optional(),
    repair: z
      .object({
        /** The type of repair team that this item is used by. */

        type: repairTypes.optional(),
      })
      .default({})
      .optional(),
    sparePart: z
      .object({
        /** Tags to indicate the systems the spare part is used to repair. If left blank it can be used with all systems */
        systemTags: z.array(z.string()).default([]),
      })
      .optional(),
    water: z.object({}).optional(),
  })
  .default({});

export type InventoryFlags = z.infer<typeof inventoryFlags>;

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
      info: "How much power is released from one unit of fuel in MegaWatt Hours.",
    },
  },
  coolant: {
    info: "Cools down things that get hot, like the reactor, engines, and weapons.",
    heatCapacity: {
      defaultValue: 4.18,
      info: "How quickly this coolant heats or cools.",
    },
    massPerUnit: {
      // The mass of 1 m^3 of water.
      defaultValue: 1000,
      info: "The mass of one unit (1 m^3) of the coolant. Used with the heat capacity to determine the heat rate.",
    },
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
