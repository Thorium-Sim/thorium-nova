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
import { WaypointRemoveSystem } from "./WaypointRemoveSystem";
import { ProcessTriggersSystem } from "./ProcessTriggersSystem";
import { WarpSystem } from "./WarpSystem";
import { ImpulseSystem } from "./ImpulseSystem";
import { ThrusterSystem } from "./ThrusterSystem";
import { PhysicsMovementSystem } from "./PhysicsMovementSystem";
import { PhysicsWorldPositionSystem } from "./PhysicsWorldPositionSystem";
import { ShipBehaviorSystem } from "./ShipBehaviorSystem";
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

const systems = [
	FilterInventorySystem,
	FilterShipsWithReactors,
	InterstellarTransitionSystem,
	SolarSystemPositionSystem,
	PassengerDestinationSystem,
	PassengerMovementSystem,
	TimerSystem,
	ReactorFuelSystem,
	ReactorHeatSystem,
	PowerDrawSystem,
	PowerDistributionSystem,
	TorpedoLoadingSystem,
	NearbyObjectsSystem,
	NPCKnowledgeSystem,
	NPCDecisionSystem,
	ShipBehaviorSystem,
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
	DataStreamSystem,
	ProcessTriggersSystem,
];
export default systems;
