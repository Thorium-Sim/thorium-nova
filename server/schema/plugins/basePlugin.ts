import {Arg, Field, ID, Mutation, ObjectType, Resolver} from "type-graphql";
import uuid from "uniqid";
import App, {Plugins} from "server/app";

@ObjectType()
export default class BasePlugin {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  author: string;

  @Field()
  description: string;

  @Field()
  coverImage: string;

  @Field(type => [String])
  tags: string[];

  constructor(params: Partial<BasePlugin>) {
    this.id = params.id || uuid();
    this.name = params.name || "New Plugin";
    this.author = params.author || "";
    this.description = params.description || "A great plugin";
    this.coverImage = params.coverImage || "";
    this.tags = params.tags || [];
  }
}
