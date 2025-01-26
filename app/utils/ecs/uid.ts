export class UIDGenerator {
	uid = 1;
	constructor(firstUID = 1) {
		this.uid = firstUID;
	}
	public next(): number {
		return this.uid++;
	}
}

export const DefaultUIDGenerator = new UIDGenerator();
