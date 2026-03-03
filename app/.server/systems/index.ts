/**
 * Since the order of system execution matters, we need to import all
 * of the systems and re-export them in an array
 */
import { DamageCheckSystem } from "@thorium/.server/systems/DamageCheckSystem";
import { legacySystems } from "@thorium/.server/systems/Legacy";
import { MainComputerDiagnosticSystem } from "@thorium/.server/systems/MainComputerDiagnosticSystem";
import { NPCDecisionSystem } from "@thorium/.server/systems/NPCDecisionSystem";
import { NPCFireWeaponsSystem } from "@thorium/.server/systems/NPCFireWeaponsSystem";
import { NPCKnowledgeSystem } from "@thorium/.server/systems/NPCKnowledgeSystem";
import { PowerEfficiencyOverloadSystem } from "@thorium/.server/systems/PowerEfficiencyOverloadSystem";
import { SensorScanSystem } from "@thorium/.server/systems/SensorScanSystem";
import { SpontaneousFailureSystem } from "@thorium/.server/systems/SpontaneousFailureSystem";
import { AutoRotateSystem } from "./AutoRotateSystem";
import { AutoThrustSystem } from "./AutoThrustSystem";
import { DataStreamSystem } from "./DataStreamSystem";
import { FilterInventorySystem } from "./FilterInventorySystem";
import { FilterShipsWithReactors } from "./FilterShipsWithReactors";
import { HeatDispersionSystem } from "./HeatDispersionSystem";
import { HeatToCoolantSystem } from "./HeatToCoolantSystem";
import { ImpulseSystem } from "./ImpulseSystem";
import { InterstellarTransitionSystem } from "./InterstellarTransitionSystem";
import { IsDestroyedSystem } from "./IsDestroyedSystem";
import { NearbyObjectsSystem } from "./NearbyObjectsSystem";
import { NPCPhaserChargeSystem } from "./NPCPhaserChargeSystem";
import { PassengerDestinationSystem } from "./PassengerDestinationSystem";
import { PassengerMovementSystem } from "./PassengerMovementSystem";
import { PhasersSystem } from "./PhasersSystem";
import { PhysicsMovementSystem } from "./PhysicsMovementSystem";
import { PowerDistributionSystem } from "./PowerDistributionSystem";
import { PowerDrawSystem } from "./PowerDrawSystem";
import { ProcessTriggersSystem } from "./ProcessTriggersSystem";
import { ReactorFuelSystem } from "./ReactorFuelSystem";
import { ReactorHeatSystem } from "./ReactorHeatSystem";
import { ShieldsSystem } from "./ShieldsSystem";
import { SolarSystemPositionSystem } from "./SolarSystemPositionSystem";
import { ThrusterSystem } from "./ThrusterSystem";
import { TimerSystem } from "./TimerSystem";
import { TorpedoLoadingSystem } from "./TorpedoLoadingSystem";
import { TorpedoMovementSystem } from "./TorpedoMovementSystem";
import { WarpSystem } from "./WarpSystem";
import { WaypointRemoveSystem } from "./WaypointRemoveSystem";
import { FacingWaypointSystem } from "./FacingWaypointSystem";
import { CollisionWarningSystem } from "./CollisionWarningSystem";
import { CommSatelliteSystem } from "@thorium/.server/systems/CommSatelliteSystem";

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
	CommSatelliteSystem,
	PhysicsMovementSystem,
	SensorScanSystem,
	MainComputerDiagnosticSystem,
	WaypointRemoveSystem,
	FacingWaypointSystem,
	CollisionWarningSystem,
	HeatToCoolantSystem,
	HeatDispersionSystem,
	DamageCheckSystem,
	SpontaneousFailureSystem,
	IsDestroyedSystem,
	// We slot the legacy systems in right before these two shared systems
	...legacySystems,
	DataStreamSystem,
	ProcessTriggersSystem,
];
export default systems;
