import {Field, ID, ObjectType} from "type-graphql";
import uuid from "uniqid";
import {Card} from "./card";

@ObjectType()
export default class Station {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field({nullable: true})
  logo: string;

  @Field()
  layout: string;

  @Field(type => [String])
  tags: string[];

  @Field(type => [Card])
  cards: Card[];

  constructor(params: Partial<Station>) {
    this.id = params.id || uuid();
    this.name = params.name || "Station";
    this.description = params.description || "";
    this.tags = params.tags || [];
    this.logo = params.logo || "";
    this.layout = params.layout || "Default";
    this.cards = [];
    params.cards?.forEach(c => this.cards.push(new Card(c)));
  }
}
