import { useEffect, useRef } from "react";
import useMeasure from "../../hooks/useMeasure";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import chroma from "chroma-js";
const sinePoints = ({
	waves,
	width,
	height,
	orientation,
}: {
	waves: {
		amplitude: number;
		frequency: number;
		phase: number;
	}[];
	width: number;
	height: number;
	orientation: "vertical" | "horizontal";
}) => {
	const points = [];
	if (orientation === "horizontal") {
		const sinWidth = width * 2 * 2;
		for (let i = 0; i < sinWidth; i++) {
			if (i % 2 === 0) points.push(i / 2);
			else {
				let point = 0;
				for (const { frequency, phase, amplitude } of waves) {
					point +=
						Math.sin(i / 2 / frequency + phase) * ((amplitude * height) / 2);
				}
				points.push(point + height / 2);
			}
		}
	} else {
		const sinHeight = height * 2 * 2;
		for (let i = 0; i < sinHeight; i++) {
			if (i % 2 === 1) points.push(i / 2);
			else {
				let point = 0;
				for (const { frequency, phase, amplitude } of waves) {
					point +=
						Math.sin(i / 2 / frequency + phase) * ((amplitude * width) / 2);
				}
				points.push(point + width / 2);
			}
		}
	}
	return points;
};

export function getSinePoint(
	i: number,
	waves: {
		amplitude: number;
		frequency: number;
		phase: number;
	}[],
	progress: number = 0,
) {
	let point = 0;
	for (const { frequency, phase, amplitude } of waves) {
		point += Math.sin(i / 2 / frequency + phase + progress) * amplitude;
	}
	return point;
}

const colors = ["red", "orange", "yellow", "#0f0", "cyan", "blue", "purple"];

const SineWave = ({
	waves,
	className = "",
	callFrame,
	color = "red",
	strokeWidth = 2,
	orientation = "horizontal",
	shouldProgress,
	shouldRender,
}: {
	waves: { amplitude: number; frequency: number; phase: number }[];
	callFrame?: (
		ctx: CanvasRenderingContext2D,
		width: number,
		height: number,
	) => void;
	className?: string;
	color?: string;
	strokeWidth?: number;
	orientation?: "vertical" | "horizontal";
	shouldProgress?: boolean;
	shouldRender?: boolean;
}) => {
	const [ref, { width, height }] = useMeasure<HTMLDivElement>();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const progressRef = useRef(0);
	useAnimationFrame(() => {
		const ctx = canvasRef.current?.getContext("2d");
		if (!canvasRef.current || !ctx) return;

		if (shouldProgress) {
			progressRef.current -= 0.3;
		}
		canvasRef.current.width = width * window.devicePixelRatio;
		canvasRef.current.height = height * window.devicePixelRatio;
		ctx.clearRect(
			0,
			0,
			width * window.devicePixelRatio,
			height * window.devicePixelRatio,
		);
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
		ctx.beginPath();
		ctx.moveTo(
			orientation === "vertical"
				? getSinePoint(0, waves, progressRef.current) * width + width / 2
				: 0,
			orientation === "vertical"
				? 0
				: getSinePoint(0, waves, progressRef.current) * height + height / 2,
		);
		for (
			let i = -10;
			i <
			(orientation === "vertical" ? height : width) * window.devicePixelRatio +
				10;
			i += window.devicePixelRatio
		) {
			ctx.lineTo(
				orientation === "vertical"
					? getSinePoint(i, waves, progressRef.current) * width + width / 2
					: i / 2,
				orientation === "vertical"
					? i / 2
					: getSinePoint(i, waves, progressRef.current) * height + height / 2,
			);
		}
		ctx.lineWidth = strokeWidth;
		ctx.strokeStyle = color;
		ctx.stroke();
		ctx.lineWidth = strokeWidth * 2;
		ctx.strokeStyle = chroma(color).alpha(0.3).hex();
		ctx.stroke();
		ctx.lineWidth = strokeWidth * 3;
		ctx.strokeStyle = chroma(color).alpha(0.2).hex();
		ctx.stroke();
		ctx.lineWidth = strokeWidth * 4;
		ctx.strokeStyle = chroma(color).alpha(0.1).hex();
		ctx.stroke();

		callFrame?.(ctx, width, height);
	}, shouldRender !== false);
	return (
		<div ref={ref} className={`w-full h-full ${className}`}>
			<canvas ref={canvasRef} className="w-full h-full" />
		</div>
	);
};

export default SineWave;
