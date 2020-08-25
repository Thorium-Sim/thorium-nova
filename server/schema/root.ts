import App from "../app";
import {Mutation, Resolver} from "type-graphql";

@Resolver()
export class RootResolver {
  @Mutation(returns => String)
  /* istanbul ignore next */
  snapshot() {
    App.snapshot();
    return "";
  }
}
