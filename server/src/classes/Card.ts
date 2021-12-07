type CardConfig = unknown;
export class Card {
  name: string;

  component: string;

  config?: CardConfig;

  icon?: string | null;

  constructor(params: Partial<Card>) {
    this.name = params.name || "Card";
    this.component = params.component || "Login";
    this.config = params.config;
    this.icon = params.icon || null;
  }
}
