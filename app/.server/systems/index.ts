/**
 * Since the order of system execution matters, we need to import all
 * of the systems and re-export them in an array
 */
import { AutoRotateSystem } from "./AutoRotateSystem";
import { AutoThrustSystem } from "./AutoThrustSystem";
import { DataStreamSystem } from "./DataStreamSystem";
import { PassengerDestinationSystem } from "./PassengerDestinationSystem";
import { PassengerMovementSystem } from "./PassengerMovementSystem";
import { TimerSystem } from "./TimerSystem";
import { InterstellarTransitionSystem } from "./InterstellarTransitionSystem";
import { ReactorFuelSystem } from "./ReactorFuelSystem";
import { FilterShipsWithReactors } from "./FilterShipsWithReactors";
import { FilterInventorySystem } from "./FilterInventorySystem";
import { ReactorHeatSystem } from "./ReactorHeatSystem";
import { HeatToCoolantSystem } from "./HeatToCoolantSystem";
import { HeatDispersionSystem } from "./HeatDispersionSystem";
import { PowerDrawSystem } from "./PowerDrawSystem";
import { NPCPhaserChargeSystem } from "./NPCPhaserChargeSystem";
import { WaypointRemoveSystem } from "./WaypointRemoveSystem";
import { ProcessTriggersSystem } from "./ProcessTriggersSystem";
import { WarpSystem } from "./WarpSystem";
import { ImpulseSystem } from "./ImpulseSystem";
import { ThrusterSystem } from "./ThrusterSystem";
import { PhysicsMovementSystem } from "./PhysicsMovementSystem";
import { PhysicsWorldPositionSystem } from "./PhysicsWorldPositionSystem";
import { NearbyObjectsSystem } from "./NearbyObjectsSystem";
import { TorpedoLoadingSystem } from "./TorpedoLoadingSystem";
import { TorpedoMovementSystem } from "./TorpedoMovementSystem";
import { IsDestroyedSystem } from "./IsDestroyedSystem";
import { PowerDistributionSystem } from "./PowerDistributionSystem";
import { ShieldsSystem } from "./ShieldsSystem";
import { PhasersSystem } from "./PhasersSystem";
import { SolarSystemPositionSystem } from "./SolarSystemPositionSystem";
import { SensorScanSystem } from "@thorium/.server/systems/SensorScanSystem";
import { NPCKnowledgeSystem } from "@thorium/.server/systems/NPCKnowledgeSystem";
import { NPCDecisionSystem } from "@thorium/.server/systems/NPCDecisionSystem";
import { NPCFireWeaponsSystem } from "@thorium/.server/systems/NPCFireWeaponsSystem";
import { legacySystems } from "@thorium/.server/systems/Legacy";
import { PowerEfficiencyOverloadSystem } from "@thorium/.server/systems/PowerEfficiencyOverloadSystem";

const systems = [
	FilterInventorySystem,
	FilterShipsWithReactors,
	InterstellarTransitionSystem,
	SolarSystemPositionSystem,
	PassengerDestinationSystem,
	PassengerMovementSystem,
	NPCFireWeaponsSystem,
	TimerSystem,
	ReactorFuelSystem,
	ReactorHeatSystem,
	PowerDrawSystem,
	PowerDistributionSystem,
	PowerEfficiencyOverloadSystem,
	NPCPhaserChargeSystem,
	TorpedoLoadingSystem,
	NearbyObjectsSystem,
	NPCKnowledgeSystem,
	NPCDecisionSystem,
	AutoRotateSystem,
	AutoThrustSystem,
	ShieldsSystem,
	ThrusterSystem,
	ImpulseSystem,
	WarpSystem,
	PhasersSystem,
	TorpedoMovementSystem,
	PhysicsWorldPositionSystem,
	PhysicsMovementSystem,
	SensorScanSystem,
	WaypointRemoveSystem,
	HeatToCoolantSystem,
	HeatDispersionSystem,
	IsDestroyedSystem,
	// We slot the legacy systems in right before these two shared systems
	...legacySystems,
	DataStreamSystem,
	ProcessTriggersSystem,
];
export default systems;
