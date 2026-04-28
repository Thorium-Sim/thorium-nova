import type { AppRouter } from "@thorium/.server/init/router";
import { rotateCharacters } from "@thorium/cards/LongRangeComm/shared";
import type { inferProcedureInput } from "@thorium/utils/live-query/.server/types";

export function RotationDecoder({
	rotation,
	updateMessageDecoding,
}: {
	rotation: number;
	updateMessageDecoding: (
		decoding: Extract<
			inferProcedureInput<AppRouter["longRangeComm"]["updateMessageDecoding"]>["decoding"],
			{ type: "rotation" }
		>,
	) => Promise<void>;
}) {
	return (
		<div className="flex h-full flex-col justify-center gap-8">
			<div
				className="grid text-xl"
				style={{
					gridTemplateColumns: `repeat(${rotateCharacters.length}, minmax(0, 1fr))`,
				}}
			>
				<div className="contents">
					{rotateCharacters.split("").map((l) => (
						<span key={l} className="border-white/50 text-center not-last:border-r">
							{l}
						</span>
					))}
				</div>
				<div className="contents">
					{(rotateCharacters.slice(rotation) + rotateCharacters.slice(0, rotation))
						.split("")
						.map((l) => (
							<span key={l} className="border-white/50 text-center not-last:border-r">
								{l}
							</span>
						))}
				</div>
			</div>
			<input
				type="range"
				className="range range-primary range-xl w-full"
				min={0}
				max={rotateCharacters.length - 1}
				step={1}
				value={rotateCharacters.length - rotation}
				onInput={async (event) =>
					updateMessageDecoding({
						type: "rotation",
						rotation: rotateCharacters.length - Number(event.currentTarget.value),
					})
				}
			/>
		</div>
	);
}
