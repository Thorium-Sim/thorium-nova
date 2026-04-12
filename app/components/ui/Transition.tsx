import {
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
	type DetailedHTMLProps,
	type HTMLAttributes,
	type RefObject,
} from "react";
import { flushSync } from "react-dom";

export function Transition({
	isOpen,
	afterLeave,
	beforeEnter,
	...props
}: {
	isOpen: boolean;
	afterLeave?: () => void;
	beforeEnter?: () => void;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
	const ref = useRef<HTMLDivElement>(null);
	const transitionState = useTransition(ref, isOpen);
	useLayoutEffect(() => {
		if (transitionState === "entered") {
			beforeEnter?.();
		}
		if (transitionState === "exited") {
			afterLeave?.();
		}
	}, [transitionState, beforeEnter, afterLeave]);
	const propsState = {
		...(transitionState === "entered"
			? { "data-entered": true, "data-entering": true }
			: {}),
		...(transitionState === "entering" ? { "data-entering": true } : {}),
		...(transitionState === "exiting" ? { "data-exiting": true } : {}),
		...(transitionState === "exited"
			? { "data-exited": true, "data-exiting": true }
			: {}),
	};

	return <div ref={ref} {...props} {...propsState} />;
}

/**
 * Provides entering and exiting states which can be used for styling
 * based on whether an animation or transition on an element is in progress
 */
export function useTransition(
	ref: RefObject<HTMLElement | null>,
	isOpen: boolean,
) {
	const [transitionState, setTransitionState] = useState<
		"entered" | "exited" | "entering" | "exiting"
	>(isOpen ? "entered" : "exited");

	switch (transitionState) {
		case "entered":
		case "entering":
			if (!isOpen) {
				setTransitionState("exiting");
			}
			break;
		case "exited":
			if (isOpen) {
				setTransitionState("entering");
			}
			break;
		case "exiting":
			if (isOpen) {
				setTransitionState("entered");
			}
			break;
	}

	useAnimation(
		ref,
		transitionState === "entering" || transitionState === "exiting",
		useCallback(() => {
			setTransitionState((state) =>
				state === "entering"
					? "entered"
					: state === "exiting"
						? "exited"
						: state,
			);
		}, []),
	);

	return transitionState;
}

function useAnimation(
	ref: RefObject<HTMLElement | null>,
	isActive: boolean,
	onEnd: () => void,
): void {
	useLayoutEffect(() => {
		if (isActive && ref.current) {
			if (!("getAnimations" in ref.current)) {
				// JSDOM
				onEnd();
				return;
			}

			const animations = ref.current.getAnimations();
			if (animations.length === 0) {
				onEnd();
				return;
			}

			let canceled = false;
			Promise.all(animations.map((a) => a.finished))
				.then(() => {
					if (!canceled) {
						flushSync(() => {
							onEnd();
						});
					}
				})
				.catch(() => {});

			return () => {
				canceled = true;
			};
		}
	}, [ref, isActive, onEnd]);
}
