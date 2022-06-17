export class UIDGenerator {
  uid: number = 0;
  constructor(firstUID = 0) {
    this.uid = firstUID;
  }
  public next(): number {
    return this.uid++;
  }
}

export const DefaultUIDGenerator = new UIDGenerator();
