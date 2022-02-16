export default class DeckPlugin {
  name: string;
  constructor(params: Partial<DeckPlugin>) {
    this.name = params.name || "Deck";
  }
}
