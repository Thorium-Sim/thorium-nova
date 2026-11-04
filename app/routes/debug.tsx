import { cn } from "cn";
import { produce } from "immer";
import { useMemo, useRef, useState, type ReactNode } from "react";

export default function Debug() {
	const [cellState, setCellState] = useState(() => Array.from({ length: 32 * 32 }).fill(false));
	const paintStyle = useRef<"" | true | false>("");
	const gridCells = useMemo(() => {
		const gridCells: ReactNode[] = [];
		for (let row = 0; row < 32; row++) {
			for (let col = 0; col < 32; col++) {
				gridCells.push(
					<div
						key={`${row}-${col}`}
						className={cn("aspect-square border-r border-b border-white/20", {
							"border-t": row === 0,
							"border-l": col === 0,
							"bg-green-500": cellState[row * 32 + col],
						})}
						onPointerDown={() => {
							setCellState(
								produce((draft) => {
									paintStyle.current = !draft[row * 32 + col];
									draft[row * 32 + col] = !draft[row * 32 + col];
								}),
							);
							document.addEventListener(
								"pointerup",
								() => {
									paintStyle.current = "";
								},
								{ once: true },
							);
						}}
						onPointerEnter={() => {
							setCellState(
								produce((draft) => {
									draft[row * 32 + col] = paintStyle.current;
								}),
							);
						}}
					></div>,
				);
			}
		}
		return gridCells;
	}, [cellState]);
	return (
		<div>
			<div className={cn("h-md grid w-md grid-cols-32 grid-rows-32")}>{gridCells}</div>
			<button onClick={() => setCellState(Array.from({ length: 32 * 32 }).fill(false))}>
				Clear
			</button>
			<button
				onClick={() => {
					const canvas = document.createElement("canvas");
					canvas.width = 32;
					canvas.height = 32;
					const ctx = canvas.getContext("2d")!;

					// Inject the pixels into the canvas context
					const imageData = ctx.createImageData(canvas.width, canvas.height);
					imageData.data.set(cellState.flatMap((b) => (b ? [255, 255, 255, 255] : [0, 0, 0, 0])));
					ctx.putImageData(imageData, 0, 0);

					// Export as a PNG Data URL
					const pngUrl = canvas.toDataURL("image/png");
					document.body.appendChild(Object.assign(document.createElement("img"), { src: pngUrl }));
				}}
			>
				Save
			</button>
		</div>
	);
}

function WeirdAnimations() {
	return (
		<>
			<div className="relative flex h-8 w-full items-center justify-center gap-4 overflow-hidden text-red-500">
				<div className="animate-pong aspect-[1/2] h-full skew-x-[76deg] bg-current [animation-delay:375ms]!" />
				<div className="animate-pong aspect-[1/2] h-full skew-x-[72deg] bg-current [animation-delay:300ms]!" />
				<div className="animate-pong aspect-[1/2] h-full skew-x-[64deg] bg-current [animation-delay:225ms]!" />
				<div className="animate-pong aspect-[1/2] h-full skew-x-[48deg] bg-current [animation-delay:150ms]!" />
				<div className="animate-pong aspect-[1/2] h-full skew-x-[32deg] bg-current [animation-delay:75ms]!" />
				<div className="animate-pong aspect-[1/2] h-full skew-x-[24deg] bg-current" />
				<p className="animate-pulse text-4xl font-bold" style={{ fontFamily: "Dungeon" }}>
					RED ALERT
				</p>
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[24deg] bg-current" />
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[32deg] bg-current [animation-delay:75ms]!" />
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[48deg] bg-current [animation-delay:150ms]!" />
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[64deg] bg-current [animation-delay:225ms]!" />
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[72deg] bg-current [animation-delay:300ms]!" />
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[76deg] bg-current [animation-delay:375ms]!" />
			</div>
			<div className="relative flex h-8 w-full items-center justify-center gap-2 overflow-hidden text-purple-500">
				<div className="animate-pong aspect-[1/3] h-full bg-current" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:75ms]!" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:150ms]!" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:225ms]!" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:300ms]!" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:375ms]!" />
				<p className="animate-pulse text-4xl font-bold" style={{ fontFamily: "Dungeon" }}>
					DANGER NOODLE
				</p>
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:375ms]!" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:300ms]!" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:225ms]!" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:150ms]!" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:75ms]!" />
				<div className="animate-pong aspect-[1/3] h-full bg-current" />
			</div>
		</>
	);
}
