import uniqid from "@thorium/uniqid";
type CardConfig = unknown;
export class Card {
  id: string;

  name: string;

  component: string;

  config: CardConfig;

  icon: string | null;

  constructor(params: Partial<Card>) {
    this.id = params.id || uniqid("crd-");
    this.name = params.name || "Card";
    this.component = params.component || "Card";
    this.config = params.config;
    this.icon = params.icon || null;
  }
}
