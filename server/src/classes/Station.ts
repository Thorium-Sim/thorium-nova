import uuid from "@thorium/uniqid";
import {Card} from "./Card";

export default class Station {
  apiVersion = "stations/v1" as const;
  kind = "stations" as const;

  name: string;

  description: string;

  logo: string;

  theme: string;

  tags: string[];

  cards: Card[];

  constructor(params: Partial<Station>) {
    this.name = params.name || "Station";
    this.description = params.description || "";
    this.tags = params.tags || [];
    this.logo = params.logo || "";
    this.theme = params.theme || "Default";
    this.cards = [];
    params.cards?.forEach(c => this.cards.push(new Card(c)));
  }
}
