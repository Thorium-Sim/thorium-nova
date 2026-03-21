import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useEffect, useRef, useState } from "react";

export function TypingText({
	children,
	keyDelay = 20,
}: {
	keyDelay?: number;
	children: string;
}) {
	const { cardLoaded } = useCardContext();
	const ref = useRef<HTMLDivElement>(null);
	const renderTime = useRef(Date.now());
	const [done, setDone] = useState(false);

	useEffect(() => {
		if (children) {
			renderTime.current = Date.now();
			setDone(false);
		}
	}, [children]);
	useAnimationFrame(() => {
		if (ref.current) {
			for (
				let i = 0;
				i < Math.round((Date.now() - renderTime.current) / keyDelay);
				i++
			) {
				(ref.current.children[i] as HTMLElement).style.opacity = "1";
			}
		}
		if (
			Math.round((Date.now() - renderTime.current) / keyDelay) >=
			children.length
		) {
			setDone(true);
		}
	}, cardLoaded && !done);
	if (done) {
		return <div>{children}</div>;
	}
	return (
		<div ref={ref}>
			{children?.split("").map((c, i) => (
				<span key={i} className="opacity-0">
					{c}
				</span>
			))}
		</div>
	);
}
