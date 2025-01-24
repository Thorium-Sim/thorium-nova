import type { BorderNode } from "@thorium/utils/FlexLayout/model/BorderNode";
import {
	TAB_SET_NODE,
	BORDER_NODE,
} from "@thorium/utils/FlexLayout/model/NODE_TYPES";
import type { RowNode } from "@thorium/utils/FlexLayout/model/RowNode";
import type { TabSetNode } from "@thorium/utils/FlexLayout/model/TabSetNode";

/** @internal */

export function adjustSelectedIndex(
	parent: TabSetNode | BorderNode | RowNode,
	removedIndex: number,
) {
	// for the tabset/border being removed from set the selected index
	if (
		parent !== undefined &&
		(parent.getType() === TAB_SET_NODE || parent.getType() === BORDER_NODE)
	) {
		const selectedIndex = (parent as TabSetNode | BorderNode).getSelected();
		if (selectedIndex !== -1) {
			if (removedIndex === selectedIndex && parent.getChildren().length > 0) {
				if (removedIndex >= parent.getChildren().length) {
					// removed last tab; select new last tab
					parent._setSelected(parent.getChildren().length - 1);
				} else {
					// leave selected index as is, selecting next tab after this one
				}
			} else if (removedIndex < selectedIndex) {
				parent._setSelected(selectedIndex - 1);
			} else if (removedIndex > selectedIndex) {
				// leave selected index as is
			} else {
				parent._setSelected(-1);
			}
		}
	}
}
