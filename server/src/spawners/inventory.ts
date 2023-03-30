import {InventoryFlags} from "@server/classes/Plugins/Inventory/InventoryFlags";
import {MegaWattHour} from "@server/utils/unitTypes";
import {NodeFlag} from "../classes/Plugins/Ship/Deck";
import {randomFromList} from "../utils/randomFromList";

type RoomI = {
  id: number;
  volume: number;
  flags: NodeFlag[];
  contents: {
    [inventoryTemplateName: string]: {count: number};
  };
  systems: string[];
};

/** Generate inventory based on the needs of the ship */
type ShipConfig = {
  powerNeed: MegaWattHour;
};

export function generateShipInventory(
  inputRooms: RoomI[],
  flightInventory: {
    [inventoryTemplateName: string]: {
      name: string;
      volume: number;
      abundance: number;
      flags: InventoryFlags;
    };
  },
  shipConfig: ShipConfig
) {
  // First, lets figure out how much space we even have
  let [totalVolume, rooms] = inputRooms.reduce(
    (
      acc: [
        number,
        {
          availableVolume: number;
          id: number;
          flags: NodeFlag[];
          systems: string[];
        }[]
      ],
      room
    ) => {
      if (!room.volume) return acc;
      const volume = acc[0] + (room.volume ?? 0);
      const roomData = {
        availableVolume: room.volume ?? 0,
        id: room.id,
        flags: room.flags ?? ["cargo"],
        systems: room.systems,
      };
      return [volume, acc[1].concat(roomData)];
    },
    [0, []]
  );

  // We only want to add the kinds of cargo that are absolutely necessary, especially at first.
  const neededInventory: string[] = [];
  if (shipConfig.powerNeed > 0) {
    neededInventory.push("fuel");
  }
  // TODO Jan 21, 2023 - these should be conditional based on reactors and systems that need heat.
  neededInventory.push("coolant");
  // TODO Jan 21, 2023 - these should be conditional based on whether there are torpedos or not
  neededInventory.push("torpedoCasing");
  neededInventory.push("torpedoWarhead");
  // TODO Jan 21, 2023 - these should be conditional based on whether there are probes or not
  neededInventory.push("probeCasing");
  neededInventory.push("probeEquipment");
  // TODO Jan 21, 2023 - these should be conditional based on whether there are crew on the ship
  // For now, if there are more than 1 rooms on the ship, they have crew
  if (inputRooms.length > 1) {
    neededInventory.push("forCrew");
    neededInventory.push("science");
    neededInventory.push("medical");
    neededInventory.push("security");
    neededInventory.push("repair");
    neededInventory.push("sparePart");
  }

  neededInventory.push("water");

  // And we need to figure out our abundance level of each piece of cargo
  // for doing weighted random selection.
  const inventoryList = Object.values(flightInventory).filter(i => {
    for (let key in i.flags) {
      if (neededInventory.includes(key)) return true;
    }
    return false;
  });
  const cargoAbundance: number[] = [];
  const totalInventoryVolume = inventoryList.reduce(
    (acc, inventoryTemplate) => {
      return acc + inventoryTemplate.volume * inventoryTemplate.abundance;
    },
    0
  );
  // Limit the amount of cargo so we don't fill up every nook and cranny
  const volumeMultiplier = 0.75;
  const shipAbundanceRatio =
    (totalVolume * volumeMultiplier) / totalInventoryVolume;

  inventoryList.forEach((inventoryTemplate, index) => {
    const abundance = inventoryTemplate.abundance * shipAbundanceRatio;
    for (let i = 0; i < abundance; i++) {
      cargoAbundance.push(index);
    }
  });

  /** Adds an inventory item to a room */
  const roomsMap = new Map<number, RoomI>();
  inputRooms.forEach(room => roomsMap.set(room.id, room));

  function addInventory(
    inventoryTemplate: {
      name: string;
      volume: number;
      abundance: number;
      flags: InventoryFlags;
    } | null,
    room: {availableVolume: number; id: number; flags: NodeFlag[]}
  ) {
    if (!inventoryTemplate) return;
    const roomEntity = roomsMap.get(room.id);
    if (!roomEntity) return;
    roomEntity.contents[inventoryTemplate.name] = roomEntity.contents[
      inventoryTemplate.name
    ] ?? {count: 0, temperature: 295.37};
    roomEntity.contents[inventoryTemplate.name].count += 1;
    totalVolume -= inventoryTemplate.volume;
    room.availableVolume -= inventoryTemplate.volume;
    const inventoryIndex = inventoryList.indexOf(inventoryTemplate);
    if (inventoryIndex === -1) return;
    const removeIndex = cargoAbundance.indexOf(inventoryIndex);
    if (removeIndex === -1) return;
    cargoAbundance.splice(removeIndex, 1);
  }
  /** Gets an inventory item randomly, weighted by abundance */
  function getWeightedRandomInventory(typeList: number[]) {
    if (typeList.length === 0) return null;
    const itemIndex = randomFromList(typeList);
    return inventoryList[itemIndex];
  }
  /**
   * Gets a random inventory room based on the type of room that's wanted.
   * If there isn't enough space in the room of that type, the item will be added
   * to the cargo hold
   */
  const roomMap = rooms.reduce(
    (acc: {[key: string]: (typeof rooms)[0][]}, room) => {
      room.flags.forEach(flag => {
        if (!acc[flag]) acc[flag] = [];
        if (flag !== "cargo") {
          acc[flag].push(room);
          return;
        }
        if (flag === "cargo") {
          // Only add to the cargo list if it doesn't have other flags
          if (room.flags.length === 1) {
            acc[flag].push(room);
          }
        }
      });
      room.systems.forEach(sys => {
        if (!acc[sys]) acc[sys] = [];
        acc[sys].push(room);
      });
      return acc;
    },
    {}
  );
  function getRandomInventoryRoom(type: string, inventoryVolume: number) {
    const room = randomFromList(
      (roomMap[type] ?? []).filter(r => r.availableVolume >= inventoryVolume)
    );
    if (!room) {
      const cargoRoom = randomFromList(
        (roomMap.cargo ?? []).filter(r => r.availableVolume >= inventoryVolume)
      );
      if (!cargoRoom) {
        return null;
      }
      return cargoRoom;
    }
    return room;
  }
  // TODO July 22 2022 - replace these numbers with actual numbers from the ship config
  const torpedoLauncherCount = 2;
  const probeLauncherCount = 1;
  // If there is only one room, we can safely assume there are no crew members
  const securityCrew = inputRooms.length > 1 ? 5 : 0;
  const repairCrew = inputRooms.length > 1 ? 5 : 0;
  const medicalCrew = inputRooms.length > 1 ? 5 : 0;

  // Next lets determine the important things
  // How much fuel does the ship need?
  // This is based on the power consumption of the ship
  // and an assumed mission duration of 2.5 hours.
  // A mission timeline could add more fuel, or the crew can
  // pick up fuel from a starbase if needed.
  const fuelItems = inventoryList.filter(i => i.flags.fuel);
  if (fuelItems.length > 0 && neededInventory.includes("fuel")) {
    let powerNeeded = shipConfig.powerNeed;
    while (powerNeeded > 0) {
      const inventoryTemplate = randomFromList(fuelItems);
      if (!inventoryTemplate.flags.fuel) continue;
      powerNeeded -= inventoryTemplate.flags.fuel?.fuelDensity || 1;

      let room = getRandomInventoryRoom("reactor", inventoryTemplate.volume);
      if (!room)
        room = getRandomInventoryRoom("fuelStorage", inventoryTemplate.volume);
      if (!room) continue;
      addInventory(inventoryTemplate, room);
    }
  }
  // How much coolant does the ship need?
  // This is based on how many systems the ship needs
  // to keep cool. Perhaps 2 * the amount of coolant needed
  // for each system

  // How many torpedos does the ship need?
  // This includes both warheads and casings and
  // is determined by the number of torpedo launchers on the ship.
  const torpedoCasingCount = torpedoLauncherCount * 8;
  const warheadCount = torpedoLauncherCount * 8;

  const casingsList: number[] = [];
  const warheadsList: number[] = [];
  cargoAbundance.forEach(index => {
    if (inventoryList[index].flags.torpedoCasing) {
      casingsList.push(index);
    }
    if (inventoryList[index].flags.torpedoWarhead) {
      warheadsList.push(index);
    }
  });

  for (let i = 0; i < torpedoCasingCount; i++) {
    const inventoryTemplate = getWeightedRandomInventory(casingsList);
    if (!inventoryTemplate) continue;
    const room = getRandomInventoryRoom(
      "torpedoStorage",
      inventoryTemplate.volume
    );
    if (!room) continue;
    addInventory(inventoryTemplate, room);
    const inventoryIndex = inventoryList.indexOf(inventoryTemplate);
    if (inventoryIndex === -1) return;
    const removeIndex = casingsList.indexOf(inventoryIndex);
    if (removeIndex === -1) return;
    casingsList.splice(removeIndex, 1);
  }
  for (let i = 0; i < warheadCount; i++) {
    const inventoryTemplate = getWeightedRandomInventory(warheadsList);
    if (!inventoryTemplate) continue;
    const room = getRandomInventoryRoom(
      "torpedoStorage",
      inventoryTemplate.volume
    );
    if (!room) continue;
    addInventory(inventoryTemplate, room);
    const inventoryIndex = inventoryList.indexOf(inventoryTemplate);
    if (inventoryIndex === -1) return;
    const removeIndex = warheadsList.indexOf(inventoryIndex);
    if (removeIndex === -1) return;
    warheadsList.splice(removeIndex, 1);
  }

  // How many probes does the ship need?
  // This is determined by the number of probe launchers on the ship.
  for (let i = 0; i < probeLauncherCount; i++) {
    // Provide at least one of every kind of probe casing
    const probeCasingIndexes: Set<number> = new Set();
    const probeEquipmentIndexes: Set<number> = new Set();
    let probeCasingTotalVolume = 0;
    let probeEquipmentTotalVolume = 0;
    cargoAbundance.forEach(index => {
      if (inventoryList[index].flags.probeCasing) {
        probeCasingIndexes.add(index);
        probeCasingTotalVolume += inventoryList[index].volume;
      }
      if (inventoryList[index].flags.probeEquipment) {
        probeEquipmentIndexes.add(index);
        probeEquipmentTotalVolume += inventoryList[index].volume;
      }
    });
    if (probeCasingIndexes.size === 0) continue;
    const totalProbeRoomVolume = rooms.reduce((acc, room) => {
      if (room.flags.includes("probeStorage")) {
        return acc + room.availableVolume;
      }
      return acc;
    }, 0);
    // Probe rooms need space for the probe equipment too, so lets only fill the room to 30% of its total volume.
    const minimumCasings = Math.max(
      1,
      (totalProbeRoomVolume * 0.3) / probeCasingTotalVolume
    );
    for (let i = 0; i < minimumCasings; i++) {
      probeCasingIndexes.forEach(index => {
        const room = getRandomInventoryRoom(
          "probeStorage",
          inventoryList[index].volume
        );
        if (!room) return;
        addInventory(inventoryList[index], room);
      });
    }
    // More probes can be added randomly if there is space in the cargo hold.
    // Now we can add probe equipment to the probe storage rooms
    const minimumEquipment = Math.max(
      2,
      (totalProbeRoomVolume * 0.3) / probeEquipmentTotalVolume
    );
    for (let i = 0; i < minimumEquipment; i++) {
      probeEquipmentIndexes.forEach(index => {
        const room = getRandomInventoryRoom(
          "probeStorage",
          inventoryList[index].volume
        );
        if (!room) return;
        addInventory(inventoryList[index], room);
      });
    }
  }

  // How many crew items does the ship need?
  // This should be based on the number and type of crew.
  // A good rule of thumb: at least one of each type of item per crew member
  // of that type. So if there are 8 security officers, at least 8
  // hand phasers.
  // This includes repair tools, security weapons, and medical supplies.
  const securityItemIndexes: Set<number> = new Set();
  const repairItemIndexes: Set<number> = new Set();
  const medicalItemIndexes: Set<number> = new Set();
  cargoAbundance.forEach(index => {
    if (inventoryList[index].flags.security) {
      securityItemIndexes.add(index);
    }
    if (inventoryList[index].flags.repair) {
      repairItemIndexes.add(index);
    }
    if (inventoryList[index].flags.medical) {
      medicalItemIndexes.add(index);
    }
  });
  for (let i = 0; i < securityCrew; i++) {
    securityItemIndexes.forEach(index => {
      const room = getRandomInventoryRoom(
        "security",
        inventoryList[index].volume
      );
      if (!room) return;
      addInventory(inventoryList[index], room);
    });
  }
  for (let i = 0; i < repairCrew; i++) {
    repairItemIndexes.forEach(index => {
      const room = getRandomInventoryRoom(
        "maintenance",
        inventoryList[index].volume
      );
      if (!room) return;
      addInventory(inventoryList[index], room);
    });
  }
  for (let i = 0; i < medicalCrew; i++) {
    medicalItemIndexes.forEach(index => {
      const room = getRandomInventoryRoom(
        "medical",
        inventoryList[index].volume
      );
      if (!room) return;
      addInventory(inventoryList[index], room);
    });
  }

  // How many spare parts are there?
  // At least one per type of part, based on the systems on the ship.

  // How much water is there? Basically fill up the water tanks.

  // Now go through the rest of the inventory and fill up the rest of the rooms
  // We'll optimize for keeping the same inventory in the same room, not spreading it out
  // TODO July 30, 2022: Rooms that are associated with ship systems should not have general
  // cargo inside them.
  const cargoRooms: Map<
    number,
    ReturnType<typeof getRandomInventoryRoom>
  > = new Map();
  while (cargoAbundance.length > 0) {
    const index = randomFromList(cargoAbundance);
    let room = cargoRooms.get(index);
    if (!room || room.availableVolume <= inventoryList[index].volume) {
      room = getRandomInventoryRoom("cargo", inventoryList[index].volume);
      cargoRooms.set(index, room);
    }
    if (!room) {
      cargoRooms.delete(index);
      break;
    }
    try {
      addInventory(inventoryList[index], room);
    } catch {
      break;
    }
  }
}
