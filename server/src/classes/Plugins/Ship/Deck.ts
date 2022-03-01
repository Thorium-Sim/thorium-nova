export default class DeckPlugin {
  name: string;
  backgroundUrl: string;
  constructor(params: Partial<DeckPlugin>) {
    this.name = params.name || "Deck";
    this.backgroundUrl = params.backgroundUrl || "";
  }
}
