import { cn } from "@thorium/utils/cn";
import { produce } from "immer";
import { useState } from "react";

export function LightsOut({
	rows = 5,
	difficulty = 4,
	onComplete,
}: {
	rows?: number;
	difficulty?: number;
	onComplete?: () => void;
}) {
	const [cells, setCells] = useState(() => {
		let cells = Array.from({ length: rows ** 2 }).fill(false) as boolean[];

		for (let i = 0; i < difficulty; i++) {
			cells = getNewCells(cells, Math.floor(Math.random() * rows ** 2));
		}

		return cells;
	});

	function getNewCells(cells: boolean[], i: number) {
		return produce(cells, (draft) => {
			draft[i] = !draft[i];
			// Cell immediately to the left and right
			if ((i + 1) % rows > 0) {
				draft[i + 1] = !draft[i + 1];
			}
			if ((i - 1) % rows < 4) {
				draft[i - 1] = !draft[i - 1];
			}

			// Cell immediately above and below
			if (i - rows >= 0) {
				draft[i - rows] = !draft[i - rows];
			}
			if (i + rows < rows ** 2) {
				draft[i + rows] = !draft[i + rows];
			}
		});
	}

	function clickCell(i: number) {
		const newCells = getNewCells(cells, i);
		setCells(newCells);
		const filteredCells = newCells.filter(Boolean);
		if (filteredCells.length === 0 || filteredCells.length === rows ** 2) {
			onComplete?.();
		}
	}

	return (
		<div>
			<div
				className="grid w-fit gap-1 place-self-center"
				style={{ gridTemplateColumns: `repeat(${rows}, 1fr)` }}
			>
				{cells.map((cell, i) => (
					<button
						key={i}
						className={cn("panel aspect-square w-16 h-16 shadow-inner shadow-blue-800", {
							"!bg-white shadow-yellow-200": cell,
						})}
						onClick={() => clickCell(i)}
					/>
				))}
			</div>
		</div>
	);
}
