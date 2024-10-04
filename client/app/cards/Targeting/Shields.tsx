import { q } from "@client/context/AppContext";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import { useLiveQuery } from "@thorium/live-query/client";
import Button from "@thorium/ui/Button";
import chroma from "chroma-js";
import { useRef } from "react";

const shieldColors = [
	"oklch(10.86% 0.045 29.25)", // Black
	"oklch(66.33% 0.2823 29.25)", // Red
	"oklch(76.18% 0.207 56.11)", // Orange
	"oklch(86.52% 0.204 90.38", // Yellow
	"oklch(86.18% 0.343 142.58)", // Green
	"oklch(57.65% 0.249 256.24)", // Blue
];
const shieldColor = (integrity: number) => {
	// @ts-expect-error chroma types are wrong - it does support oklch
	return chroma.scale(shieldColors).mode("oklch")(integrity).css("oklch");
};
const shieldStyle = (
	shields: {
		strength: number;
		maxStrength: number;
		direction: "fore" | "aft" | "starboard" | "port" | "dorsal" | "ventral";
	}[],
	extra = false,
) => {
	// Creates the styles for multiple shields
	const output: string[] = [];
	shields.forEach((s) => {
		const integrity = s.strength / s.maxStrength;
		const color = shieldColor(integrity);
		if (
			(s.direction === "starboard" && !extra) ||
			(s.direction === "fore" && extra)
		) {
			output.push(`20px 0px 20px -15px ${color}`);
			output.push(`inset -20px 0px 20px -15px ${color}`);
		}
		if (
			(s.direction === "port" && !extra) ||
			(s.direction === "aft" && extra)
		) {
			output.push(`-20px 0px 20px -15px ${color}`);
			output.push(`inset 20px 0px 20px -15px ${color}`);
		}
		if (s.direction === "fore" && !extra) {
			output.push(`0px -20px 20px -15px ${color}`);
			output.push(`inset 0px 20px 20px -15px ${color}`);
		}
		if (s.direction === "aft" && !extra) {
			output.push(`0px 20px 20px -15px ${color}`);
			output.push(`inset 0px -20px 20px -15px ${color}`);
		}
		if (s.direction === "ventral" && extra) {
			output.push(`0px 20px 20px -15px ${color}`);
			output.push(`inset 0px -20px 20px -15px ${color}`);
		}
		if (s.direction === "dorsal" && extra) {
			output.push(`0px -20px 20px -15px ${color}`);
			output.push(`inset 0px 20px 20px -15px ${color}`);
		}
	});
	return output.join(",");
};

export function Shields({ cardLoaded }: { cardLoaded: boolean }) {
	const [ship] = q.ship.player.useNetRequest();
	const [shields] = q.targeting.shields.get.useNetRequest();

	const topViewRef = useRef<HTMLDivElement>(null);
	const sideViewRef = useRef<HTMLDivElement>(null);

	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const shieldItems: {
			strength: number;
			maxStrength: number;
			direction: "fore" | "aft" | "starboard" | "port" | "dorsal" | "ventral";
		}[] = [];
		for (const shield of shields) {
			const strength = interpolate(shield.id)?.x || 0;
			shieldItems.push({ ...shield, strength });
		}
		topViewRef.current?.style.setProperty(
			"box-shadow",
			shieldStyle(shieldItems),
		);
		sideViewRef.current?.style.setProperty(
			"box-shadow",
			shieldStyle(shieldItems, true),
		);
	}, cardLoaded);
	if (!ship) return null;
	if (shields.length === 0) return null;
	return (
		<div>
			<div className="flex w-full gap-8 mb-4">
				<div
					ref={topViewRef}
					className="flex-1 aspect-square rounded-full p-4"
					style={{ boxShadow: shieldStyle(shields) }}
				>
					<img src={ship.assets.topView} alt="Top" />
				</div>
				{shields.length === 6 ? (
					<div
						ref={sideViewRef}
						className="flex-1 aspect-square rounded-full p-4"
						style={{ boxShadow: shieldStyle(shields, true) }}
					>
						<img src={ship.assets.sideView} alt="Side" />
					</div>
				) : null}
			</div>
			{shields[0].state === "down" ? (
				<Button
					className="btn-primary btn-sm w-full"
					onClick={() => {
						q.targeting.shields.setState.netSend({ state: "up" });
					}}
				>
					Raise Shields
				</Button>
			) : (
				<Button
					className="btn-warning btn-sm w-full"
					onClick={() => {
						q.targeting.shields.setState.netSend({ state: "down" });
					}}
				>
					Lower Shields
				</Button>
			)}
		</div>
	);
}
