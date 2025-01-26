import { TabSetNode } from "./TabSetNode";
import { BorderNode } from "./BorderNode";
import type { TabNode } from "./TabNode";

/** @internal */
export function adjustSelectedIndexAfterFloat(node: TabNode) {
	const parent = node.getParent();
	if (parent !== null) {
		if (parent instanceof TabSetNode) {
			let found = false;
			let newSelected = 0;
			const children = parent.getChildren();
			for (let i = 0; i < children.length; i++) {
				const child = children[i] as TabNode;
				if (child === node) {
					found = true;
				} else {
					if (!child.isFloating()) {
						newSelected = i;
						if (found) break;
					}
				}
			}
			parent._setSelected(newSelected);
		} else if (parent instanceof BorderNode) {
			parent._setSelected(-1);
		}
	}
}

/** @internal */
export function adjustSelectedIndexAfterDock(node: TabNode) {
	const parent = node.getParent();
	if (
		parent !== null &&
		(parent instanceof TabSetNode || parent instanceof BorderNode)
	) {
		const children = parent.getChildren();
		for (let i = 0; i < children.length; i++) {
			const child = children[i] as TabNode;
			if (child === node) {
				parent._setSelected(i);
				return;
			}
		}
	}
}

export function randomUUID() {
	// @ts-ignore
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
		(
			c ^
			(crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
		).toString(16),
	);
}
