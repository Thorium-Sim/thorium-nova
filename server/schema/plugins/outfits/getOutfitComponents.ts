import {TagsComponent} from "server/components/tags";
import {IsOutfitComponent} from "server/components/outfits/isOutfit";
import {IdentityComponent} from "server/components/identity";
import {WarpEnginesComponent} from "server/components/outfits/warpEngines";
import {NavigationComponent} from "server/components/outfits/navigation";
import {JumpDriveComponent} from "server/components/outfits/jumpDrive";
import {ImpulseEnginesComponent} from "server/components/outfits/impulseEngines";
import {ThrustersComponent} from "server/components/outfits/thrusters";
import {DamageComponent} from "server/components/outfits/damage";
import {EfficiencyComponent} from "server/components/outfits/efficiency";
import {PowerComponent} from "server/components/outfits/power";
import {HeatComponent} from "server/components/heat";
import {Component} from "server/components/utils";
import {registerEnumType} from "type-graphql";
import {ShipAssignmentComponent} from "server/components/ship/shipAssignment";
import {DampenerComponent} from "server/components/outfits/dampeners";

export enum OutfitAbilities {
  warpEngines = "warpEngines",
  impulseEngines = "impulseEngines",
  thrusters = "thrusters",
  navigation = "navigation",
  jumpDrive = "jumpDrive",
  inertialDampeners = "inertialDampeners",
  generic = "generic",
}

registerEnumType(OutfitAbilities, {
  name: "OutfitAbilities",
});

export function getOutfitComponents(
  ability: OutfitAbilities
): {component: Component; defaultValue?: any}[] {
  switch (ability) {
    case OutfitAbilities.warpEngines:
      return [
        {
          component: IsOutfitComponent,
          defaultValue: {outfitType: "warpEngines"},
        },
        {component: WarpEnginesComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
        {component: ShipAssignmentComponent},
      ];
    case OutfitAbilities.impulseEngines:
      return [
        {
          component: IsOutfitComponent,
          defaultValue: {outfitType: "impulseEngines"},
        },
        {component: ImpulseEnginesComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
        {component: ShipAssignmentComponent},
      ];
    case OutfitAbilities.thrusters:
      return [
        {component: IsOutfitComponent, defaultValue: {outfitType: "thrusters"}},
        {component: ThrustersComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
        {component: ShipAssignmentComponent},
      ];
    case OutfitAbilities.navigation:
      return [
        {
          component: IsOutfitComponent,
          defaultValue: {outfitType: "navigation"},
        },
        {component: NavigationComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: ShipAssignmentComponent},
      ];
    case OutfitAbilities.jumpDrive:
      return [
        {component: IsOutfitComponent, defaultValue: {outfitType: "jumpDrive"}},
        {component: JumpDriveComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
        {component: ShipAssignmentComponent},
      ];
    case OutfitAbilities.inertialDampeners:
      return [
        {
          component: IsOutfitComponent,
          defaultValue: {outfitType: "inertialDampeners"},
        },
        {component: DampenerComponent},
        {component: PowerComponent},
        {component: EfficiencyComponent},
        {component: DamageComponent},
        {component: HeatComponent},
        {component: ShipAssignmentComponent},
      ];
    case OutfitAbilities.generic:
      return [
        {component: PowerComponent},
        {component: DamageComponent},
        {component: ShipAssignmentComponent},
      ];
    default:
      return [];
  }
}
