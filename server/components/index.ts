import {Field, ObjectType} from "type-graphql";
import {TimerComponent} from "./timer";
import {IsShipComponent} from "./isShip";
import {AlertLevelComponent} from "./ship/alertLevel";
import {IdentityComponent} from "./identity";
import {TagsComponent} from "./tags";
import {ThemeComponent} from "./theme";
import {StationComplementComponent} from "./stationComplement";
import {ShipAssetsComponent} from "./ship/shipAssets";
import {IsPlanetComponent} from "./isPlanet";
import {IsStarComponent} from "./isStar";
import {PlanetarySystemComponent} from "./planetarySystem";
import {PositionComponent} from "./position";
import {SatelliteComponent} from "./satellite";
import {SizeComponent} from "./size";
import {TemperatureComponent} from "./temperature";
import {AtmosphereCompositionComponent} from "./atmosphereComposition";
import {PopulationComponent} from "./population";
import {DamageComponent} from "./outfits/damage";
import {EfficiencyComponent} from "./outfits/efficiency";
import {IsOutfitComponent} from "./outfits/isOutfit";
import {PowerComponent} from "./outfits/power";
import {TrainingModeComponent} from "./outfits/trainingMode";
import {ImpulseEnginesComponent} from "./outfits/impulseEngines";
import {WarpEnginesComponent} from "./outfits/warpEngines";
import {JumpDriveComponent} from "./outfits/jumpDrive";
import {NavigationComponent} from "./outfits/navigation";
import {ThrustersComponent} from "./outfits/thrusters";
import {HeatComponent} from "./heat";
import {RotationComponent} from "./rotation";
import {RotationVelocityComponent} from "./rotationVelocity";
import {VelocityComponent} from "./velocity";
import {DampenerComponent} from "./outfits/dampeners";
import {ShipAssignmentComponent} from "./ship/shipAssignment";
import {ShipOutfitsComponent} from "./ship/shipOutfits";
import {AutopilotComponent} from "./ship/autopilot";
import {InterstellarPositionComponent} from "./ship/interstellarPosition";
import {IsFactionComponent} from "./isFaction";
import {FactionAssignmentComponent} from "./factionAssignment";
import {IsPlayerShipComponent} from "./playerShip/isPlayerShip";
import {HasFlightDirectorComponent} from "./playerShip/hasFlightDirector";
@ObjectType()
export default class Components {
  @Field()
  timer?: TimerComponent;

  @Field()
  identity?: IdentityComponent;

  @Field()
  tags?: TagsComponent;

  @Field({nullable: true})
  position?: PositionComponent;
  @Field()
  velocity?: VelocityComponent;

  @Field({nullable: true})
  rotation?: RotationComponent;
  @Field()
  rotationVelocity?: RotationVelocityComponent;

  @Field({nullable: true})
  size?: SizeComponent;

  @Field({nullable: true})
  temperature?: TemperatureComponent;

  @Field(type => PopulationComponent, {nullable: true})
  population?: PopulationComponent;

  // Ship Entity Components
  @Field({nullable: true})
  isShip?: IsShipComponent;

  @Field({nullable: true})
  shipAssets?: ShipAssetsComponent;

  @Field()
  alertLevel?: AlertLevelComponent;

  @Field()
  theme?: ThemeComponent;

  @Field()
  stationComplement?: StationComplementComponent;

  @Field(type => ShipAssignmentComponent)
  shipAssignment?: ShipAssignmentComponent;

  @Field()
  shipOutfits?: ShipOutfitsComponent;

  @Field()
  dampener?: DampenerComponent;

  @Field()
  autopilot?: AutopilotComponent;

  @Field({nullable: true})
  interstellarPosition?: InterstellarPositionComponent;

  // Stellar Objects Components
  @Field({nullable: true})
  planetarySystem?: PlanetarySystemComponent;

  @Field({nullable: true})
  isStar?: IsStarComponent;

  @Field({nullable: true})
  isPlanet?: IsPlanetComponent;

  @Field()
  satellite?: SatelliteComponent;

  @Field()
  atmosphereComposition?: AtmosphereCompositionComponent;

  // Outfits Components
  @Field({nullable: true})
  damage?: DamageComponent;

  @Field({nullable: true})
  efficiency?: EfficiencyComponent;

  @Field()
  isOutfit?: IsOutfitComponent;

  @Field({nullable: true})
  power?: PowerComponent;

  @Field({nullable: true})
  heat?: HeatComponent;

  @Field({nullable: true})
  trainingMode?: TrainingModeComponent;

  // Outfit Abilities
  @Field()
  warpEngines?: WarpEnginesComponent;

  @Field()
  impulseEngines?: ImpulseEnginesComponent;

  @Field()
  jumpDrive?: JumpDriveComponent;

  @Field()
  navigation?: NavigationComponent;

  @Field()
  thrusters?: ThrustersComponent;

  // Factions
  @Field()
  isFaction?: IsFactionComponent;

  @Field({nullable: true})
  factionAssignment?: FactionAssignmentComponent;

  // Player Ship
  @Field()
  isPlayerShip?: IsPlayerShipComponent;

  @Field()
  hasFlightDirector?: HasFlightDirectorComponent;
}

export const registeredComponents = [
  TimerComponent,
  IsShipComponent,
  AlertLevelComponent,
  IdentityComponent,
  TagsComponent,
  ThemeComponent,
  ShipAssetsComponent,
  PositionComponent,
  SizeComponent,
  TemperatureComponent,
  StationComplementComponent,
  PlanetarySystemComponent,
  IsStarComponent,
  IsPlanetComponent,
  SatelliteComponent,
  PopulationComponent,
  AtmosphereCompositionComponent,
  DamageComponent,
  EfficiencyComponent,
  PowerComponent,
  IsOutfitComponent,
  HeatComponent,
  TrainingModeComponent,
  WarpEnginesComponent,
  ImpulseEnginesComponent,
  JumpDriveComponent,
  NavigationComponent,
  ThrustersComponent,
  DampenerComponent,
  ShipAssignmentComponent,
  ShipOutfitsComponent,
  AutopilotComponent,
  InterstellarPositionComponent,
  RotationComponent,
  VelocityComponent,
  RotationVelocityComponent,
  IsFactionComponent,
  FactionAssignmentComponent,
  IsPlayerShipComponent,
  HasFlightDirectorComponent,
];
