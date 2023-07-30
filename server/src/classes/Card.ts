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

export class Widget {
  name: string;

  component: string;

  config?: CardConfig;

  icon?: string | null;

  size?: "sm" | "md" | "lg" | "xl";

  resize?: boolean;

  constructor(params: Partial<Widget>) {
    this.name = params.name || "Remote Access";
    this.component = params.component || "RemoteAccess";
    this.config = params.config;
    this.icon = params.icon || null;
    this.size = params.size || "md";
    this.resize = params.resize || false;
  }
}
