import {cardSubscriptions} from "client/src/utils/cardData";

type CardConfig = unknown;
export class Card {
  name: string;

  component: keyof typeof cardSubscriptions;

  config?: CardConfig;

  icon?: string | null;

  constructor(params: Partial<Card>) {
    this.name = params.name || "Card";
    this.component = params.component || "Card";
    this.config = params.config;
    this.icon = params.icon || null;
  }
}
