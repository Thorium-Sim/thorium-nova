import {buildSchema as buildTypeSchema} from "type-graphql";
import {pubsub} from "./pubsub";
import {resolvers} from "../schema";

export default function buildSchema() {
  return buildTypeSchema({
    resolvers,
    pubSub: pubsub,
    validate: false,
  });
}
