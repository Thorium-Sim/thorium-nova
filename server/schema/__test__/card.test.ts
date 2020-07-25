import {Card} from "../card";

describe("Schema: Card", () => {
  it("Should initialize with default data", () => {
    const card = new Card({});
    expect(card.name).toEqual("Card");
    expect(card.component).toEqual("Card");
    expect(card.icon).toEqual(null);
  });
});
