import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { Icon } from "@thorium/ui/Icon";
import Input from "@thorium/ui/Input";
import { Joystick } from "@thorium/ui/Joystick";
import Select from "@thorium/ui/Select";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import { useRef, useState } from "react";

const speeds = [
	{ id: 1000, label: "Instant" },
	{ id: 5, label: "Warp" },
	{ id: 1, label: "Very Fast" },
	{ id: 0.6, label: "Fast" },
	{ id: 0.4, label: "Moderate" },
	{ id: 0.2, label: "Slow" },
	{ id: 0.05, label: "Very Slow" },
];

export function LegacySensorGridCore() {
	const [page, setPage] = useState<"Icons" | "Extras" | "Move">("Icons");
	return (
		<div className="grid grid-cols-3 h-full overflow-hidden justify-items-end">
			<div className="w-full flex flex-col max-h-full h-full min-h-0">
				<Select
					size="xxs"
					items={speeds}
					label="Speed"
					labelHidden
					selected={1}
					setSelected={() => {}}
				/>
				<div className="flex w-full gap-1">
					<Button className="flex-1 btn-xs btn-error">Clear</Button>
					<Button className="flex-1 btn-xs btn-warning">Stop</Button>
				</div>
				<div className="flex btn-group">
					<Button
						className={cn("flex-1 btn-xs btn-success", {
							"btn-active": page === "Icons",
						})}
						onClick={() => setPage("Icons")}
					>
						Icons
					</Button>
					<Button
						className={cn("flex-1 btn-xs btn-info", {
							"btn-active": page === "Extras",
						})}
						onClick={() => setPage("Extras")}
					>
						Extras
					</Button>
					<Button
						className={cn("flex-1 btn-xs btn-primary", {
							"btn-active": page === "Move",
						})}
						onClick={() => setPage("Move")}
					>
						Move
					</Button>
				</div>
				{page === "Icons" ? (
					<IconsPage />
				) : page === "Extras" ? (
					<ExtrasPage />
				) : page === "Move" ? (
					<MovePage />
				) : null}
			</div>
			<div className="aspect-square relative col-span-2 h-full max-h-full overflow-y-hidden">
				<GridLines />
			</div>
		</div>
	);
}

function IconsPage() {
	return (
		<div className="h-full flex flex-col">
			<div className="flex-1" />
			<Button className="btn-xs btn-success">Add Contact</Button>
			<div className="flex justify-around gap-2 text-xs">
				<div>
					Planet
					<div className="w-5 h-5 bg-white border-2 border-gray-400 rounded-full cursor-pointer" />
				</div>
				<div>
					Border
					<div className="w-8 h-3 mt-1 bg-white border-2 border-gray-400 cursor-pointer" />
				</div>
				<div>
					Ping
					<div className="w-5 h-5 bg-white border-2 border-gray-400 rounded-full cursor-pointer shadow-[inset_0_0_6px_rgba(0,0,0,0.5)]" />
				</div>
			</div>
		</div>
	);
}

function ExtrasPage() {
	return (
		<div className="overflow-y-auto flex-1">
			<div className="flex justify-between">
				<div className="flex-1">
					<Select
						size="xxs"
						items={[100, 90, 75, 60, 50, 45, 30, 20, 15, 10, 7, 5, 3, 2, 1].map(
							(i) => ({ id: i, label: `${i}` }),
						)}
						label="Nudge Distance"
						labelProps={{ className: "text-xs" }}
						selected={5}
						setSelected={() => {}}
					/>
				</div>
				<div className="grid grid-cols-3 justify-items-end">
					<button>
						<Icon name="rotate-ccw" />
					</button>
					<button>
						<Icon name="arrow-up" />
					</button>
					<button>
						<Icon name="rotate-cw" />
					</button>
					<button>
						<Icon name="arrow-left" />
					</button>
					<button>
						<Icon name="arrow-down" />
					</button>
					<button>
						<Icon name="arrow-right" />
					</button>
				</div>
			</div>
			<div className="text-xs">
				<Checkbox label="Ask for speed" />
				<Checkbox label="Add to targeting" />
				<Checkbox label="Use sonar ping" />
				<Checkbox label="Show contact labels" />
				<Checkbox label="Auto-thrusters" />
				<label>
					Interference
					<input type="range" />
				</label>
				<p>Option-click grid segments to black out</p>
			</div>
		</div>
	);
}

function MovePage() {
	const ref = useRef<{ reset: () => void }>(null);
	return (
		<div className="p-2">
			<Joystick id="move" sticky ref={ref} onDrag={() => {}} />
			<Button
				className="btn-xs btn-warning"
				onClick={() => ref.current?.reset()}
			>
				Reset
			</Button>
		</div>
	);
}

function GridLines({
	rings = 3,
	lines = 12,
	aligned = false,
}: { rings?: number; lines?: number; aligned?: boolean }) {
	return (
		<>
			{Array(rings)
				.fill(0)
				.map((_, i, array) => (
					<div
						key={`ring-${i}`}
						className="border border-white/20 rounded-full pointer-events-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
						style={{
							width: `${((i + 1) / array.length) * 100}%`,
							height: `${((i + 1) / array.length) * 100}%`,
						}}
					/>
				))}
			{Array(lines)
				.fill(0)
				.map((_, i, array) => (
					<div
						key={`line-${i}`}
						className="bg-white/10 w-full h-px pointer-events-none absolute top-1/2 -translate-y-1/2"
						style={{
							transform: `rotate(${
								((i + (aligned ? 0 : 0.5)) / array.length) * 360
							}deg)`,
						}}
					/>
				))}
		</>
	);
}
