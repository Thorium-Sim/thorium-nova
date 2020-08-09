import Entity from "server/helpers/ecs/entity";
import {Field, ObjectType} from "type-graphql";
import BasePlugin from "./plugins/basePlugin";

@ObjectType()
export default class UniverseTemplate extends BasePlugin {
  @Field(type => [Entity])
  entities: Entity[];

  @Field(type => [Entity])
  get systems() {
    return this.entities.filter(e => e.planetarySystem);
  }
  constructor(params: Partial<UniverseTemplate> = {}) {
    super({...params, name: params.name || "New Universe"});
    this.entities = params.entities?.map(e => new Entity(e)) || [];
  }
}
