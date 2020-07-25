import {Field, ID, ObjectType} from "type-graphql";
import uuid from "uniqid";

@ObjectType()
export class CardConfig {
  @Field()
  _empty!: string;
  constructor(params: Partial<CardConfig> = {}) {}
}

@ObjectType()
export class Card {
  /* istanbul ignore next */
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  component: string;

  @Field()
  config: CardConfig;

  /* istanbul ignore next */
  @Field(type => String, {nullable: true})
  icon: string | null;

  constructor(params: Partial<Card>) {
    this.id = params.id || uuid();
    this.name = params.name || "Card";
    this.component = params.component || "Card";
    this.config = new CardConfig(params.config);
    this.icon = params.icon || null;
  }
}
