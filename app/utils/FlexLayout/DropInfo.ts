import type { DockLocation } from "./DockLocation";
import type { IDropTarget } from "./model/IDropTarget";
import type { Node } from "./model/Node";
import type { Rect } from "./Rect";

export class DropInfo {
	node: Node & IDropTarget;
	rect: Rect;
	location: DockLocation;
	index: number;
	className: string;

	constructor(
		node: Node & IDropTarget,
		rect: Rect,
		location: DockLocation,
		index: number,
		className: string,
	) {
		this.node = node;
		this.rect = rect;
		this.location = location;
		this.index = index;
		this.className = className;
	}
}
