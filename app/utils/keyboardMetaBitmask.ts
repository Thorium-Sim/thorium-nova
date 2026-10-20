// Used to create and parse a stable bitmask from keyboard meta properties,
// guaranteeing there's only one key definition per key/meta combination
const bitmasks = {
	shift: 0b1,
	alt: 0b10,
	meta: 0b100,
	control: 0b1000,
	capsLock: 0b10000,
} as const;

export function getBitmaskFromMeta(meta: ("shift" | "alt" | "meta" | "control" | "capsLock")[]) {
	let bitmask = 0;
	for (let metaItem of meta) {
		bitmask |= bitmasks[metaItem];
	}
	return bitmask;
}

export function getMetaFromBitmask(bitmask: number) {
	let meta: ("shift" | "alt" | "meta" | "control" | "capsLock")[] = [];
	for (let metaItem in bitmasks) {
		if (bitmask & bitmasks[metaItem as keyof typeof bitmasks]) {
			meta.push(metaItem as keyof typeof bitmasks);
		}
	}
	return meta;
}
