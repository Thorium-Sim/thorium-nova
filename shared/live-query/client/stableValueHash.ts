function serializer(replacer: any) {
	const stack: any = [];
	const keys: any = [];

	const cycleReplacer = (_key: string, value: any) => {
		if (stack[0] === value) return "[Circular ~]";
		return `[Circular ~.${keys.slice(0, stack.indexOf(value)).join(".")}]`;
	};

	return function (this: any, key: any, value: any) {
		if (stack.length > 0) {
			const thisPos = stack.indexOf(this);
			~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
			~thisPos
				? keys.splice(thisPos, Number.POSITIVE_INFINITY, key)
				: keys.push(key);
			if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value);
		} else stack.push(value);

		return replacer == null ? value : replacer.call(this, key, value);
	};
}

export function stableValueHash(value: any): string {
	return JSON.stringify(
		value,
		serializer((_: unknown, val: any) =>
			isPlainObject(val)
				? Object.keys(val)
						.sort()
						.reduce((result, key) => {
							result[key] = val[key];
							return result;
						}, {} as any)
				: val,
		),
	);
}

function hasObjectPrototype(o: any): boolean {
	return Object.prototype.toString.call(o) === "[object Object]";
}
// Copied from: https://github.com/jonschlinkert/is-plain-object
// biome-ignore lint/complexity/noBannedTypes: We want to know if it is an object or not
export function isPlainObject(o: any): o is Object {
	if (!hasObjectPrototype(o)) {
		return false;
	}

	// If has modified constructor
	const ctor = o.constructor;
	if (typeof ctor === "undefined") {
		return true;
	}

	// If has modified prototype
	const prot = ctor.prototype;
	if (!hasObjectPrototype(prot)) {
		return false;
	}

	// If constructor does not have an Object-specific method
	// biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
	if (!prot.hasOwnProperty("isPrototypeOf")) {
		return false;
	}

	// Most likely a plain Object
	return true;
}
