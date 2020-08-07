import Entity from "server/helpers/ecs/entity";
import {Field, ID, ObjectType} from "type-graphql";
import uuid from "uniqid";
import BasePlugin from "./plugins/basePlugin";

@ObjectType()
export default class UniverseTemplate extends BasePlugin {
  @Field(type => [Entity])
  entities: Entity[];

  constructor(params: Partial<UniverseTemplate>) {
    super({...params, name: params.name || "New Universe"});
    this.entities = params.entities?.map(e => new Entity(e)) || [];
  }
}
