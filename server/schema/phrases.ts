import App from "server/app";
import {pubsub} from "server/helpers/pubsub";
import {randomFromList} from "server/helpers/randomFromList";
import {
  Arg,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  registerEnumType,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";

import uuid from "uniqid";
import {getPlugin} from "./plugins/basePlugin";

export enum PhraseTypes {
  word = "word",
  phrase = "phrase",
  space = "space",
}

registerEnumType(PhraseTypes, {name: "PhraseTypes"});

@ObjectType()
@InputType("PhraseUnitInput")
class PhraseUnit {
  @Field(type => ID, {nullable: true})
  id: string;
  @Field(type => PhraseTypes)
  type: PhraseTypes;
  @Field(type => [String])
  contents: string[];
  constructor(params: Partial<PhraseUnit> = {}) {
    this.id = params.id || uuid();
    this.type = params.type || PhraseTypes.word;
    this.contents = params.contents || [];
  }
}

@ObjectType()
export class Phrase {
  @Field(type => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  category: string;

  @Field(type => [PhraseUnit], {
    description: "All of the units in the phrase",
  })
  units: PhraseUnit[];

  constructor(params: Partial<Phrase>) {
    this.id = params.id || uuid();
    this.name = params.name || "New Phrase";
    this.category = params.category || "";
    this.units = params.units?.map(p => new PhraseUnit(p)) || [];
  }
}

const phraseCache: {[id: string]: Phrase} = {};
export const getPhrase = (phraseId: string) => {
  if (phraseCache[phraseId]) return phraseCache[phraseId];
  const phrase = App.plugins.reduce((prev: Phrase | null, next) => {
    if (prev) return prev;
    return next.phrases.find(p => p.id === phraseId) || null;
  }, null);
  if (phrase) {
    phraseCache[phraseId] = phrase;
    return phrase;
  }
  throw new Error("Cannot find phrase");
};
export function parsePhrase(phrase: Phrase): string {
  return (
    phrase.units
      .map(unit => {
        const item = randomFromList(unit.contents);
        if (unit.type === PhraseTypes.phrase) {
          return parsePhrase(getPhrase(item));
        }
        if (unit.type === PhraseTypes.space) {
          return " ";
        }
        if (unit.type === PhraseTypes.word) {
          return item;
        }
      })
      .join("") || ""
  );
}

@Resolver()
export class PhrasesResolver {
  @Query(returns => [Phrase], {name: "phrases"})
  phrasesQuery(@Arg("pluginId", type => ID) pluginId: string): Phrase[] {
    const plugin = getPlugin(pluginId);

    return plugin.phrases;
  }
  @Query(returns => String)
  phraseParse(@Arg("phraseId", type => ID) phraseId: string): string {
    return parsePhrase(getPhrase(phraseId));
  }
  @Mutation(returns => Phrase)
  phraseCreate(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("name") name: string
  ) {
    const plugin = getPlugin(pluginId);
    const phrase = new Phrase({name});
    plugin.phrases.push(phrase);
    pubsub.publish("phrases", {pluginId, phrases: plugin.phrases});
    return phrase;
  }
  @Mutation(returns => String)
  phraseRemove(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("id", type => ID) id: string
  ) {
    const plugin = getPlugin(pluginId);
    for (let i = 0; i < plugin.phrases.length; i++) {
      if (plugin.phrases[i].id === id) {
        plugin.phrases.splice(i, 1);
        break;
      }
    }
    pubsub.publish("phrases", {pluginId, phrases: plugin.phrases});
    return "";
  }
  @Mutation(returns => Phrase)
  phraseSetName(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("phraseId", type => ID) phraseId: string,
    @Arg("name") name: string
  ) {
    const plugin = getPlugin(pluginId);
    const phrase = plugin.phrases.find(p => p.id === phraseId);
    if (!phrase) throw new Error("Cannot find phrase");
    phrase.name = name;
    pubsub.publish("phrases", {pluginId, phrases: plugin.phrases});
    return phrase;
  }
  @Mutation(returns => Phrase)
  phraseSetCategory(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("phraseId", type => ID) phraseId: string,
    @Arg("category") category: string
  ) {
    const plugin = getPlugin(pluginId);
    const phrase = plugin.phrases.find(p => p.id === phraseId);
    if (!phrase) throw new Error("Cannot find phrase");
    phrase.category = category;
    pubsub.publish("phrases", {pluginId, phrases: plugin.phrases});
    return phrase;
  }
  @Mutation(returns => Phrase)
  phraseSetContents(
    @Arg("pluginId", type => ID) pluginId: string,
    @Arg("phraseId", type => ID) phraseId: string,
    @Arg("units", type => [PhraseUnit]) units: PhraseUnit[]
  ) {
    const plugin = getPlugin(pluginId);
    const phrase = plugin.phrases.find(p => p.id === phraseId);
    if (!phrase) throw new Error("Cannot find phrase");
    phrase.units = units;
    pubsub.publish("phrases", {pluginId, phrases: plugin.phrases});
    return phrase;
  }
  @Subscription(returns => [Phrase], {
    topics: ({args: {pluginId}}) => {
      const subId = uuid();
      process.nextTick(() => {
        const plugin = getPlugin(pluginId);
        pubsub.publish(subId, {
          pluginId,
          phrases: plugin.phrases,
        });
      });
      return [subId, "phrases"];
    },
    filter: ({payload, args: {pluginId}}) => {
      return payload.pluginId === pluginId;
    },
  })
  phrases(
    @Root() payload: {phrases: Phrase[]},
    @Arg("pluginId", type => ID) pluginId?: string
  ): Phrase[] {
    return payload.phrases;
  }
}
