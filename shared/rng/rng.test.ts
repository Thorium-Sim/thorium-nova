import {createRNG, skipN} from ".";

describe("rng", () => {
  it("should generate a series of random numbers", () => {
    const numbers = [];
    const rng = createRNG(1);
    numbers.push(rng.next());
    numbers.push(rng.next());
    numbers.push(rng.next());
    expect(JSON.stringify(numbers)).toMatchInlineSnapshot(
      `"[0.417021998534217,0.9971848083653452,0.7203244894557457]"`
    );
    const rng2 = createRNG(1);
    let otherNumbers = [];
    otherNumbers.push(rng2.next());
    otherNumbers.push(rng2.next());
    otherNumbers.push(rng2.next());
    expect(JSON.stringify(numbers)).toEqual(JSON.stringify(otherNumbers));
    const rng3 = createRNG(2);
    otherNumbers = [];
    otherNumbers.push(rng3.next());
    otherNumbers.push(rng3.next());
    otherNumbers.push(rng3.next());
    expect(JSON.stringify(numbers)).not.toEqual(JSON.stringify(otherNumbers));
  });
  it("should allow skipping of numbers", () => {
    const rng = createRNG(1, 10);
    const num1 = rng.next();

    const rng2 = createRNG(1);
    let num2 = 0;
    for (let i = 0; i < 11; i++) {
      num2 = rng2.next();
    }
    expect(num1).toEqual(num2);
    let rng3 = createRNG(1);
    rng3 = skipN(rng3, 10);
    num2 = rng3.next();
    expect(num1).toEqual(num2);
  });
  it("should generate int values between two numbers", () => {
    const rng = createRNG(2);
    const numbers = [];
    numbers.push(rng.nextInt(1, 10));
    numbers.push(rng.nextInt(1, 100));
    numbers.push(rng.nextInt(1, 1000));
    numbers.push(rng.nextInt(900, 1000));
    numbers.push(rng.nextInt(900, 1000));
    numbers.push(rng.nextInt(-100, 50));
    numbers.push(rng.nextInt(-100, 50));
    numbers.push(rng.nextInt(-100, 500));
    numbers.push(rng.nextInt(10, 5));

    expect(JSON.stringify(numbers)).toMatchInlineSnapshot(
      `"[9,88,302,901,976,-89,-97,220,10]"`
    );
  });
  it("should pick random values from a list", () => {
    const list = ["a", "b", "c", "d", "e"];
    const rng = createRNG(1);
    const values = [];
    values.push(rng.nextFromList(list));
    values.push(rng.nextFromList(list));
    values.push(rng.nextFromList(list));
    values.push(rng.nextFromList(list));
    values.push(rng.nextFromList(list));
    values.push(rng.nextFromList(list));
    values.push(rng.nextFromList(list));
    values.push(rng.nextFromList(list));
    values.push(rng.nextFromList(list));
    values.push(rng.nextFromList(list));
    expect(
      JSON.stringify(values).replace(new RegExp('"', "g"), "'")
    ).toMatchInlineSnapshot(`"['c','e','d','e','a','a','b','e','a','b']"`);
  });
  it("should work with different iterations of value generation", () => {
    const rng1 = createRNG(1);
    const rng2 = createRNG(1);

    rng1.next();
    rng1.nextInt(1, 10);
    rng1.nextFromList([1, 2, 3, 4]);
    rng2.next();
    rng2.nextInt(11, 20);
    rng2.nextFromList(["a", "b", "c", "d"]);
    rng2.nextInt(100, 500);
    rng1.next();
    expect(rng1.next()).toEqual(rng2.next());
  });
  it("should work with the other random value types", () => {
    const values = [];
    const rng1 = createRNG(2);
    values.push(rng1.nextBoolean());
    values.push(rng1.nextBoolean());
    values.push(rng1.nextBoolean());

    values.push(rng1.nextChar());
    values.push(rng1.nextChar());
    values.push(rng1.nextChar());
    values.push(rng1.nextChar("abc"));
    values.push(rng1.nextChar("abc"));
    values.push(rng1.nextChar("abc"));

    values.push(rng1.nextString(5));
    values.push(rng1.nextString(6));
    values.push(rng1.nextString(7));

    expect(
      JSON.stringify(values).replace(new RegExp('"', "g"), "'")
    ).toMatchInlineSnapshot(
      `"[false,false,false,'s','y','1','a','b','c','DC7Rj','Z5DToQ','usdr90C']"`
    );
    expect(rng1.iterationCount).toMatchInlineSnapshot(`27`);
    expect(rng1.seed).toMatchInlineSnapshot(`2`);

    const rng2 = createRNG(rng1.seed, rng1.iterationCount);
    expect(rng1.nextString()).toEqual(rng2.nextString());
  });
});
