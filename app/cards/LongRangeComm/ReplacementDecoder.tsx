import type { AppRouter } from "@thorium/.server/init/router";
import { replaceCharacters } from "@thorium/cards/LongRangeComm/shared";
import { cn } from "@thorium/utils/cn";
import type { inferProcedureInput } from "@thorium/utils/live-query/.server/types";

export function ReplacementDecoder({
	letterMap,
	updateMessageDecoding,
}: {
	letterMap: string;
	updateMessageDecoding: (
		decoding: Extract<
			inferProcedureInput<AppRouter["longRangeComm"]["updateMessageDecoding"]>["decoding"],
			{ type: "replacement" }
		>,
	) => Promise<void>;
}) {
	return (
		<div className="grid h-full grid-flow-col-dense grid-cols-9 grid-rows-4 items-center gap-8 py-4">
			{replaceCharacters.split("").map((l, i) => (
				<div key={l} className="flex gap-2">
					<div className="panel w-[3ch] p-2 text-center">{l}</div>
					<input
						className={cn("input w-[3ch] p-2 h-full text-center text-base", {
							"input-error":
								letterMap.indexOf(letterMap[i]) !== letterMap.lastIndexOf(letterMap[i]),
							"input-alert":
								letterMap.indexOf(letterMap[i]) === letterMap.lastIndexOf(letterMap[i]),
						})}
						defaultValue={letterMap[i]}
						maxLength={1}
						onChange={(event) => {
							const newLetterMap = letterMap.split("");
							const newChar = event.currentTarget.value.slice(0, 1).toLowerCase().trim();
							if (newChar) {
								newLetterMap[i] = newChar;
								updateMessageDecoding({
									type: "replacement",
									letterMap: newLetterMap.slice(0, replaceCharacters.length).join(""),
								});
							}
						}}
					/>
				</div>
			))}
		</div>
	);
}
