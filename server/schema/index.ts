import {ClientResolver} from "./client";
import {EntityFieldResolver, EntityResolver} from "./ecs";
import {FlightResolver} from "./flight";
import {PluginResolver} from "./plugins/basePlugin";
import {PluginOutfitBasicResolver} from "./plugins/outfits/basic";
import {ImpulseEnginesOutfitResolver} from "./plugins/outfits/impulseEngines";
import {NavigationOutfitResolver} from "./plugins/outfits/navigation";
import {ThrustersOutfitResolver} from "./plugins/outfits/thrusters";
import {PluginOutfitResolver} from "./plugins/outfits/outfits";
import {WarpEngineOutfitResolver} from "./plugins/outfits/warpEngines";
import {ShipAssetsResolver, ShipPluginResolver} from "./plugins/ship";
import {StationComplementPluginResolver} from "./plugins/stationComplement";
import {UniversePluginResolver} from "./plugins/universe";
import {
  PlanetAssetsResolver,
  UniversePluginPlanetsResolver,
} from "./plugins/universe/planets";
import PlanetTypeResolver from "./plugins/universe/planetTypes";
import {UniverseSatelliteResolver} from "./plugins/universe/satellite";
import {UniversePluginStarsResolver} from "./plugins/universe/stars";
import StarTypeResolver from "./plugins/universe/starTypes";
import {
  PlanetarySystemResolver,
  SatelliteComponentResolver,
  UniversePluginSystemsResolver,
} from "./plugins/universe/systems";
import {RootResolver} from "./root";
import {ShipResolver} from "./ship";
import {TimerResolver} from "./timer";
import {PluginShipBasicResolver} from "./plugins/ship/basic";
import {PluginShipOutfitResolver} from "./plugins/ship/outfits";
import {PluginShipPhysicalResolver} from "./plugins/ship/physical";
import {
  ActivePlanetarySystemResolver,
  UniverseResolver,
} from "./activeFlight/universe";
import {
  ActiveShipsResolver,
  InterstellarPositionComponentResolver,
} from "./activeFlight/ships";
import {PhrasesResolver} from "./phrases";
import {UniversePluginStarbasesResolver} from "./plugins/universe/starbases";
import {EffectResolver} from "./effects";
import {AlertLevelResolver} from "./components/alertLevel";
import {ThemesResolver} from "./plugins/themes";
import {WaypointsResolver} from "./activeFlight/waypoints";

type ResolverT =
  | readonly [Function, ...Function[]]
  | [Function, ...Function[]]
  | readonly [string, ...string[]]
  | [string, ...string[]];

export const resolvers: ResolverT = [
  RootResolver,
  ClientResolver,
  FlightResolver,
  EntityResolver,
  TimerResolver,
  ShipResolver,
  ShipPluginResolver,
  StationComplementPluginResolver,
  ShipAssetsResolver,
  EntityFieldResolver,
  UniversePluginSystemsResolver,
  StarTypeResolver,
  PlanetTypeResolver,
  UniversePluginStarsResolver,
  PlanetarySystemResolver,
  UniversePluginPlanetsResolver,
  UniverseSatelliteResolver,
  UniversePluginStarbasesResolver,
  PlanetAssetsResolver,
  SatelliteComponentResolver,
  PluginResolver,
  UniversePluginResolver,
  PluginOutfitResolver,
  PluginOutfitBasicResolver,
  WarpEngineOutfitResolver,
  ImpulseEnginesOutfitResolver,
  NavigationOutfitResolver,
  ThrustersOutfitResolver,
  PluginShipBasicResolver,
  PluginShipOutfitResolver,
  PluginShipPhysicalResolver,
  UniverseResolver,
  ActivePlanetarySystemResolver,
  ActiveShipsResolver,
  InterstellarPositionComponentResolver,
  PhrasesResolver,
  EffectResolver,
  AlertLevelResolver,
  ThemesResolver,
  WaypointsResolver,
];
