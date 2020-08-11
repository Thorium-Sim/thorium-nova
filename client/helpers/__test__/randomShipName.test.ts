import randomShipName from "../randomShipName";

const savedMath = global.Math;
describe("random ship name", () => {
  beforeEach(() => {
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.5;
    global.Math = mockMath;
  });
  afterEach(() => {
    global.Math = savedMath;
  });
  it("should produce random civilian ship names", () => {
    expect(randomShipName.civilian()).toMatchInlineSnapshot(`"Kiwi Queen"`);
    expect(randomShipName.civilian1()).toMatchInlineSnapshot(`"Diligent Cave"`);
    expect(randomShipName.civilian2()).toMatchInlineSnapshot(`"Forest Walrus"`);
    expect(randomShipName.civilian3()).toMatchInlineSnapshot(
      `"Canute's Stars"`
    );
    expect(randomShipName.civilian4()).toMatchInlineSnapshot(
      `"Barons and Barons"`
    );
    expect(randomShipName.civilian5()).toMatchInlineSnapshot(`"Thirteen Bees"`);
    expect(randomShipName.civilian6()).toMatchInlineSnapshot(
      `"Alana of the Spice"`
    );
    expect(randomShipName.civilian7()).toMatchInlineSnapshot(
      `"Shanshan the Diligent"`
    );
    expect(randomShipName.civilian8()).toMatchInlineSnapshot(`"Kiwi Queen"`);
    expect(randomShipName.civilian9()).toMatchInlineSnapshot(
      `"Walrus of the Star"`
    );
    expect(randomShipName.civilian10()).toMatchInlineSnapshot(
      `"Atlantis Name"`
    );
    expect(randomShipName.civilian11()).toMatchInlineSnapshot(`"Hero"`);
    expect(randomShipName.civilian12()).toMatchInlineSnapshot(`"Luo Ming"`);
    expect(randomShipName.civilian13()).toMatchInlineSnapshot(`"Flamelord"`);
    expect(randomShipName.civilian14()).toMatchInlineSnapshot(`"Papillion"`);
    expect(randomShipName.civilian15()).toMatchInlineSnapshot(
      `"Master of the Angel"`
    );
  });
  it("should produce random republic ship names", () => {
    expect(randomShipName.republicCapital()).toMatchInlineSnapshot(
      `"R.N.S. Raleigh"`
    );
    expect(randomShipName.republicFighter()).toMatchInlineSnapshot(
      `"Gold Seven"`
    );
    expect(randomShipName.republicSmall()).toMatchInlineSnapshot(
      `"R.N.S. Daly"`
    );
  });
  it("should produce random deep ship names", () => {
    expect(randomShipName.deep()).toMatchInlineSnapshot(`"D.S.S. Hall"`);
    expect(randomShipName.deepFighter()).toMatchInlineSnapshot(`"Delta Seven"`);
  });
  it("should produce random free worlds ship names", () => {
    expect(randomShipName.militia()).toMatchInlineSnapshot(
      `"I.M.S. Eucalyptus"`
    );
    expect(randomShipName.freeWorldsCapital()).toMatchInlineSnapshot(
      `"F.S. Eucalyptus"`
    );
    expect(randomShipName.freeWorldsFighter()).toMatchInlineSnapshot(
      `"Hound Seven"`
    );
    expect(randomShipName.freeWorldsSmall()).toMatchInlineSnapshot(
      `"F.S. Rose"`
    );
    global.Math.random = () => 0.1;
    expect(randomShipName.freeWorldsFighter()).toMatchInlineSnapshot(
      `"Echo 1-1"`
    );
  });
  it("should produce random syndicate ship names", () => {
    expect(randomShipName.syndicateCapital()).toMatchInlineSnapshot(
      `"S.S. Metellus"`
    );
    expect(randomShipName.syndicateSmall()).toMatchInlineSnapshot(`"F-55N5"`);
    expect(randomShipName.syndicateFighter()).toMatchInlineSnapshot(`"F-555"`);
  });
  it("should produce random bounty hunter ship names", () => {
    expect(randomShipName.bountyHunter1()).toMatchInlineSnapshot(
      `"Cursed Prison"`
    );
    expect(randomShipName.bountyHunter2()).toMatchInlineSnapshot(
      `"Spikes of Order"`
    );
    expect(randomShipName.bountyHunter()).toMatchInlineSnapshot(
      `"Splattered Narkan"`
    );
  });
  it("should produce random pirate ship names", () => {
    expect(randomShipName.pirate()).toMatchInlineSnapshot(`"Striker of Blood"`);
    expect(randomShipName.pirate1()).toMatchInlineSnapshot(`"Boiled Lady"`);
    expect(randomShipName.pirate2()).toMatchInlineSnapshot(
      `"Splattered Narkan"`
    );
    expect(randomShipName.pirate3()).toMatchInlineSnapshot(
      `"Balthazar's Lady"`
    );
    expect(randomShipName.pirate4()).toMatchInlineSnapshot(
      `"Balthazar the Rotten"`
    );
    expect(randomShipName.pirate5()).toMatchInlineSnapshot(
      `"Striker of Blood"`
    );
    expect(randomShipName.pirate6()).toMatchInlineSnapshot(`"Violent Ogre"`);
    expect(randomShipName.pirate7()).toMatchInlineSnapshot(`"Lady"`);
    expect(randomShipName.pirate8()).toMatchInlineSnapshot(`"Redslayer"`);
    expect(randomShipName.pirate9()).toMatchInlineSnapshot(`"Rotted Dignity"`);
  });
  it("should produce random alien names", () => {
    expect(randomShipName.quarg()).toMatchInlineSnapshot(`"Plogonilup"`);
    expect(randomShipName.pug()).toMatchInlineSnapshot(`"Quim Klort Hort"`);
  });
});
