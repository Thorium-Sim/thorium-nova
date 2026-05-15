import * as React from "react";

import { CLASSES } from "../Types";
import type { LayoutInternal } from "./Layout";

/** @internal */
export interface IOverlayProps {
	layout: LayoutInternal;
	show: boolean;
}

/** @internal */
export const Overlay = (props: IOverlayProps) => {
	const { layout, show } = props;

	return (
		<div
			className={layout.getClassName(CLASSES.FLEXLAYOUT__LAYOUT_OVERLAY)}
			style={{ display: show ? "flex" : "none" }}
		/>
	);
};
