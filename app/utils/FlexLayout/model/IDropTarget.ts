import type { DockLocation } from "../DockLocation";
import type { DropInfo } from "../DropInfo";
import type { IDraggable } from "./IDraggable";
import type { Node } from "./Node";

export interface IDropTarget {
	/** @internal */
	canDrop(
		dragNode: Node & IDraggable,
		x: number,
		y: number,
	): DropInfo | undefined;
	/** @internal */
	drop(
		dragNode: Node & IDraggable,
		location: DockLocation,
		index: number,
		select?: boolean,
	): void;
	/** @internal */
	isEnableDrop(): boolean;
}
