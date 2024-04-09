import {
	autoPlacement,
	useFloating,
	getOverflowAncestors,
	shift,
} from "@floating-ui/react-dom";
import type React from "react";
import { type ReactNode, useEffect, useLayoutEffect, useState } from "react";
import Button from "@thorium/ui/Button";
import useOnClickOutside from "@client/hooks/useClickOutside";
import { Portal } from "@headlessui/react";
import { Icon } from "./Icon";

const InfoTip = ({ children }: { children: ReactNode }) => {
	const { x, y, strategy, refs, update } = useFloating({
		placement: "left",
		middleware: [autoPlacement(), shift()],
	});
	const [visible, setVisible] = useState(false);
	// Update on scroll and resize for all relevant nodes
	useEffect(() => {
		if (!refs.reference.current || !refs.floating.current) {
			return;
		}
		const parents = [
			...getOverflowAncestors(refs.reference.current as HTMLElement),
			...getOverflowAncestors(refs.floating.current),
		];
		parents.forEach((parent) => {
			parent.addEventListener("scroll", update);
			parent.addEventListener("resize", update);
		});
		return () => {
			parents.forEach((parent) => {
				parent.removeEventListener("scroll", update);
				parent.removeEventListener("resize", update);
			});
		};
	}, [refs.reference, refs.floating, update]);

	useLayoutEffect(() => {
		if (visible) {
			update();
		}
	}, [update, visible]);

	useOnClickOutside(
		refs.reference as React.MutableRefObject<HTMLElement>,
		(event) => {
			if (refs.floating.current?.contains(event.target as Node)) return;
			setVisible(false);
		},
	);
	return (
		<>
			<Button
				className="btn btn-ghost btn-xs p-0"
				ref={refs.setReference}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setVisible((v) => !v);
				}}
			>
				<Icon
					name="info"
					className="inline-block text-primary text-base cursor-pointer"
				/>
			</Button>
			<Portal>
				<div
					ref={refs.setFloating}
					style={{
						position: strategy,
						top: y ?? "",
						left: x ?? "",
					}}
					className={`max-w-xs w-max z-10 border-transparent shadow-lg bg-opacity-90 bg-black text-white rounded-lg p-2 ${
						visible ? "block" : "hidden"
					}`}
				>
					{children}
				</div>
			</Portal>
		</>
	);
};
export default InfoTip;
