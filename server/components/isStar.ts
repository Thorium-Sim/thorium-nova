import {Field, ObjectType} from "type-graphql";
import {Component, ComponentOmit} from "./utils";

@ObjectType()
export class IsStarComponent extends Component {
  static id: "isStar" = "isStar";
  static defaults: ComponentOmit<IsStarComponent> = {
    solarMass: 1,
    age: 4000000000,
    spectralType: "G",
    hue: 0,
    isWhite: false,
  };

  @Field({description: "The mass of the star in comparison to the Sun"})
  solarMass: number = 1;

  @Field({description: "The age of the star in years"})
  age: number = 4000000000;

  @Field({
    description: "The spectral type of the star, one of O,B,G,K,A,MG,M,D",
  })
  spectralType: string = "G";

  @Field({description: "The color hue of the star, based on the spectral type"})
  hue: number = 0;

  @Field({description: "Whether the star appears to be white"})
  isWhite: boolean = false;
}
