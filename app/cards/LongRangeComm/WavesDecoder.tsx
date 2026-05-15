import type { AppRouter } from "@thorium/.server/init/router";
import SineWave, { getSinePoint } from "@thorium/ui/SineWave";
import type { inferProcedureInput } from "@thorium/utils/live-query/.server/types";
import { useRef, useState } from "react";

export function WavesDecoder({
	waves,
	updateMessageDecoding,
}: {
	waves: {
		amplitude: number;
		frequency: number;
		phase: number;
		requiredAmplitude: number;
		requiredFrequency: number;
		requiredPhase: number;
	}[];
	updateMessageDecoding: (
		decoding: Extract<
			inferProcedureInput<AppRouter["longRangeComm"]["updateMessageDecoding"]>["decoding"],
			{ type: "waves" }
		>,
	) => Promise<void>;
}) {
	const waveWidthPercent = 0.25;
	const waveAnimationRef = useRef(0);
	const [selectedWaveIndex] = useState(0);
	const selectedWave = waves[selectedWaveIndex];

	return (
		<div className="grid h-full grid-cols-[auto_1fr] grid-rows-[1fr_auto_auto_auto] gap-2 py-4">
			<SineWave
				className="col-span-2 flex-auto"
				waves={waves}
				callFrame={(ctx, width, height) => {
					const requiredWaves = waves.map(
						({ requiredAmplitude, requiredFrequency, requiredPhase }) => ({
							amplitude: requiredAmplitude,
							frequency: requiredFrequency,
							phase: requiredPhase,
						}),
					);
					ctx.beginPath();

					for (
						let i = -10 + waveAnimationRef.current;
						i < width * window.devicePixelRatio * waveWidthPercent + 10 + waveAnimationRef.current;
						i += 1
					) {
						ctx.lineTo(i / 2, getSinePoint(i, requiredWaves) * height + height / 2);
					}
					ctx.lineWidth = 1;
					ctx.strokeStyle = "#ffff00";
					ctx.stroke();

					waveAnimationRef.current += 10;
					if (waveAnimationRef.current > width * 2) {
						waveAnimationRef.current = -width * 2 * waveWidthPercent;
					}
				}}
			/>
			<div className="text-right">Frequency:</div>
			<div>
				<input
					type="range"
					className="range range-error"
					value={selectedWave.frequency}
					onInput={(e) => {
						updateMessageDecoding({
							type: "waves",
							waves: waves.map((w, i) =>
								i === selectedWaveIndex ? { ...w, frequency: Number(e.currentTarget.value) } : w,
							),
						});
					}}
				/>
			</div>
			<div className="text-right">Amplitude:</div>
			<div>
				<input
					type="range"
					className="range range-warning"
					value={selectedWave.amplitude}
					min={0}
					max={0.5}
					step={0.01}
					onInput={(e) => {
						updateMessageDecoding({
							type: "waves",
							waves: waves.map((w, i) =>
								i === selectedWaveIndex ? { ...w, amplitude: Number(e.currentTarget.value) } : w,
							),
						});
					}}
				/>
			</div>
			<div className="text-right">Phase:</div>
			<div>
				<input
					type="range"
					className="range range-success"
					value={selectedWave.phase}
					onInput={(e) => {
						updateMessageDecoding({
							type: "waves",
							waves: waves.map((w, i) =>
								i === selectedWaveIndex ? { ...w, phase: Number(e.currentTarget.value) } : w,
							),
						});
					}}
				/>
			</div>
		</div>
	);
}
