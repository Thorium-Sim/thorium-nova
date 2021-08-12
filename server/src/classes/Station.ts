import uuid from "@thorium/uniqid";
import {Card} from "./Card";

export default class Station {
  id: string;

  name: string;

  description: string;

  logo: string;

  layout: string;

  tags: string[];

  cards: Card[];

  constructor(params: Partial<Station>) {
    this.id = params.id || uuid("sta-");
    this.name = params.name || "Station";
    this.description = params.description || "";
    this.tags = params.tags || [];
    this.logo = params.logo || "";
    this.layout = params.layout || "Default";
    this.cards = [];
    params.cards?.forEach(c => this.cards.push(new Card(c)));
  }
}
