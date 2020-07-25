import {Field, ObjectType} from "type-graphql";
import {TimerComponent} from "./timer";
import {IsShipComponent} from "./isShip";
import {AlertLevelComponent} from "./alertLevel";
import {IdentityComponent} from "./identity";
import {TagsComponent} from "./tags";
import {ThemeComponent} from "./theme";

@ObjectType()
export default class Components {
  @Field()
  timer?: TimerComponent;

  @Field()
  isShip?: IsShipComponent;

  @Field()
  alertLevel?: AlertLevelComponent;

  @Field()
  identity?: IdentityComponent;

  @Field()
  tags?: TagsComponent;

  @Field()
  theme?: ThemeComponent;
}

export const registeredComponents = [
  TimerComponent,
  IsShipComponent,
  AlertLevelComponent,
  IdentityComponent,
  TagsComponent,
  ThemeComponent,
];
