export class UIDGenerator {
  uid: number = 1;
  constructor(firstUID = 1) {
    this.uid = firstUID;
  }
  public next(): number {
    return this.uid++;
  }
}

export const DefaultUIDGenerator = new UIDGenerator();
