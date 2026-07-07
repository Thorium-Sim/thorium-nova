import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function Portal({
	children,
	target = document.body,
}: {
	children: ReactNode;
	target?: Element | DocumentFragment | null;
}) {
	return createPortal(children, target || document.body);
}
