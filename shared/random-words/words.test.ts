import randomWords from ".";

describe("random-words", function () {
  it("should return one word when called with no arguments", function () {
    let word = randomWords()[0];
    expect(typeof word).toEqual("string");
    expect(word.length).not.toEqual(0);
    expect(word.indexOf(" ")).toEqual(-1);
  });
  it("should return 5 words when called with the number 5", function () {
    let words = randomWords(5);
    expect(words.length).toEqual(5);
  });
  it("should return between 5 and 10 words when called with min: 5 and max: 10", function () {
    let words = randomWords({min: 5, max: 10});
    expect(words.length).toBeLessThanOrEqual(10);
    expect(words.length).toBeGreaterThanOrEqual(5);
  });
  it("returns result of variable length when called with min: 5 and max: 10", function () {
    let lengths: {[key: number]: boolean} = {};
    for (let i = 0; i < 100; i++) {
      let words = randomWords({min: 5, max: 10});
      lengths[words.length] = true;
    }
    expect(Object.keys(lengths).length).toBeGreaterThan(1);
  });
  it("should return 5 space separated words when join is used with exactly: 5", function () {
    let phrase = randomWords({exactly: 5}).join(" ");
    expect(typeof phrase).toEqual("string");
    expect(phrase.match(/\S/)).toBeTruthy();
    phrase = phrase.replace(/[\S]/g, "");
    expect(phrase.length).toEqual(4);
  });
  it("should only return words within the maxLength", function () {
    let maxWordSize = 4;
    let words = randomWords({exactly: 10000, maxLength: maxWordSize});
    words.forEach(word => {
      expect(word.length).toBeLessThanOrEqual(maxWordSize);
      expect(word.length).toBeGreaterThan(0);
    });
  });
  it("should return 5 space separated words for each string if wordsPerString is set to 5 and exactly > 1", function () {
    let words = randomWords({exactly: 10, wordsPerString: 5});
    words.forEach(string => {
      const stringSplitted = string.split(" ");
      expect(stringSplitted.length).toEqual(5);
    });
  });
  it("should reuturn 5 words separated by a separator for each string if wordsPerString > 1, separator is defined as a string and exactly > 1", function () {
    const separator = "-";
    let words = randomWords({exactly: 10, wordsPerString: 5, separator});
    words.forEach(string => {
      const stringSplitted = string.split(separator);
      expect(typeof separator).toEqual("string");
      expect(stringSplitted.length).toEqual(5);
    });
  });
  it("should return styled strings if formatter is defined as a function that returns a string", function () {
    const formatter = (word: string) => word.toUpperCase();
    let words = randomWords({exactly: 10, formatter});
    words.forEach(word => {
      expect(word).toEqual(word.toUpperCase());
    });
  });
  it("should support a special random int function", function () {
    let words = randomWords({exactly: 10, randomFloat: () => 0.5});
    let otherWords = randomWords({exactly: 10, randomFloat: () => 0.5});
    expect(words).toEqual(otherWords);
  });
});
