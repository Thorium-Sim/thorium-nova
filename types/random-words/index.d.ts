declare module "random-words" {
  interface RandomWords {
    (count: number): string[];
  }

  declare const randomWords: RandomWords;
  export = randomWords;
}
