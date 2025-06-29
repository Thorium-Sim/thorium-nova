import * as React from "react";
import type { TabNode } from "../model/TabNode";
import type { LayoutInternal } from "./Layout";
import { CLASSES } from "../Types";
import { TabButtonStamp } from "./TabButtonStamp";

/** @internal */
export interface IDragContainerProps {
	node: TabNode;
	layout: LayoutInternal;
}

/** @internal */
export const DragContainer = (props: IDragContainerProps) => {
	const { layout, node } = props;
	const selfRef = React.useRef<HTMLDivElement | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	React.useEffect(() => {
		node.setTabStamp(selfRef.current);
	}, [node, selfRef.current]);

	const cm = layout.getClassName;

	const classNames = cm(CLASSES.FLEXLAYOUT__DRAG_RECT);

	return (
		<div ref={selfRef} className={classNames}>
			<TabButtonStamp key={node.getId()} layout={layout} node={node} />
		</div>
	);
};
