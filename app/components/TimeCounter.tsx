import { useCardContext } from "@thorium/context/CardContext";
import useInterval from "@thorium/hooks/useInterval";
import { capitalCase } from "change-case";
import { Duration } from "luxon";
import { useRef } from "react";

function calculateTime(milliseconds: number) {
	if (milliseconds < 1000) return "Just now";
	return `${
		Object.entries(
			Duration.fromObject({
				months: 0,
				weeks: 0,
				days: 0,
				hours: 0,
				minutes: 0,
				seconds: 0,
				milliseconds,
			})
				.normalize()
				.toObject(),
		)
			.filter((t) => t[1] !== 0)
			.map((t) => `${t[1]} ${capitalCase(t[0])}`)[0]
	} ago`;
}

export function TimeCounter({ time }: { time: Date }) {
	const { cardLoaded } = useCardContext();
	const timeRef = useRef<HTMLSpanElement>(null);
	useInterval(
		() => {
			if (timeRef.current) {
				timeRef.current.innerText = calculateTime(Date.now() - Number(time));
			}
		},
		cardLoaded ? 1000 : null,
	);
	return <span ref={timeRef}>{calculateTime(Date.now() - Number(time))}</span>;
}
