import { q } from "@client/context/AppContext";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import type { CardProps } from "@client/routes/flight.station/CardProps";
import { cn } from "@client/utils/cn";
import { useLiveQuery } from "@thorium/live-query/client";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import RadialDial from "@thorium/ui/RadialDial";
import { Tooltip } from "@thorium/ui/Tooltip";
import {
	type Dispatch,
	forwardRef,
	type SetStateAction,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { Fragment } from "react/jsx-runtime";
import { createRNG } from "@thorium/rng";

/**
 * TODO:
 * - Reactor boxes should turn yellow based on the amount of power being used by batteries or systems
 * - Which means there needs to be more data indicating where power is allocated
 *
 */
export function SystemsMonitor({ cardLoaded }: CardProps) {
	const [reactors] = q.systemsMonitor.reactors.get.useNetRequest();
	const [batteries] = q.systemsMonitor.batteries.get.useNetRequest();
	const [systems] = q.systemsMonitor.systems.get.useNetRequest();

	q.systemsMonitor.stream.useDataStream();

	const [selectedPowerSupplier, setSelectedPowerSupplier] = useState<
		number | null
	>(null);
	const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
	return (
		<div className="relative grid grid-cols-5 gap-8 h-full">
			<div className="flex flex-col justify-around gap-4">
				{reactors.map((reactor, i) => (
					<Reactor
						key={reactor.id}
						{...reactor}
						index={i}
						selectedPowerSupplier={selectedPowerSupplier}
						setSelectedPowerSupplier={setSelectedPowerSupplier}
						cardLoaded={cardLoaded}
					/>
				))}
			</div>
			<div className="flex flex-col justify-around gap-4">
				{batteries.map((battery, i) => (
					<Battery
						{...battery}
						index={i}
						key={battery.id}
						selectedPowerSupplier={selectedPowerSupplier}
						setSelectedPowerSupplier={setSelectedPowerSupplier}
						cardLoaded={cardLoaded}
					/>
				))}
			</div>
			<div
				className="grid grid-cols-3 gap-4 col-span-3 place-content-center"
				style={{
					gridAutoRows: "min-content",
				}}
			>
				{systems.map((system) => (
					<System
						key={system.id}
						{...system}
						cardLoaded={cardLoaded}
						selectedSystem={selectedSystem}
						setSelectedSystem={setSelectedSystem}
					/>
				))}
			</div>
		</div>
	);
}

function Reactor({
	name,
	id,
	index,
	selectedPowerSupplier,
	setSelectedPowerSupplier,
	nominalHeat,
	maxSafeHeat,
	maxHeat,
	fuel,
	reserve,
	desiredOutput,
	maxOutput,
	optimalOutputPercent,
	cardLoaded,
}: {
	name: string;
	id: number;
	index: number;
	selectedPowerSupplier: number | null;
	setSelectedPowerSupplier: Dispatch<SetStateAction<number | null>>;
	nominalHeat: number;
	maxSafeHeat: number;
	maxHeat: number;
	fuel: number;
	reserve: number;
	desiredOutput: number;
	maxOutput: number;
	optimalOutputPercent: number;
	cardLoaded: boolean;
}) {
	const heatRef = useRef<HTMLDivElement>(null);
	const heatProgressRef = useRef<{ setValue: (value: number) => void }>(null);

	const elementRefs = useRef<Map<number, HTMLDivElement>>(new Map());

	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const reactor = interpolate(id);
		if (!reactor) return;
		const currentOutput = reactor.x;

		for (const [i, el] of elementRefs.current) {
			if (i + 1 <= Math.ceil(currentOutput)) {
				el.classList.add("border-yellow-400");
				el.classList.remove("border-gray-400");
			} else {
				el.classList.add("border-gray-400");
				el.classList.remove("border-yellow-400");
			}
		}

		const heat = reactor.z;
		const heatValue = (heat - nominalHeat) / (maxHeat - nominalHeat);
		if (heatRef.current) {
			heatRef.current.innerText = `Heat: ${Math.round(heat)}K`;
		}
		if (heatProgressRef.current) {
			heatProgressRef.current.setValue(heatValue);
		}
	}, cardLoaded);

	return (
		<div
			aria-label={name}
			onClick={() => setSelectedPowerSupplier(id)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					setSelectedPowerSupplier(id);
				}
			}}
			key={id}
			aria-expanded={selectedPowerSupplier === id}
			className={cn(
				"cursor-pointer text-left relative w-full grid grid-cols-[auto_1fr] items-center gap-x-2 p-2 panel panel-primary overflow-hidden group",
				{
					"brightness-150": selectedPowerSupplier === id,
				},
			)}
		>
			<div className="col-span-2 gap-1 self-start flex items-center">
				<span className="truncate">
					{name} {index + 1}
				</span>
				<div className="flex-1" />
				<Tooltip ref={heatRef} content={`Heat: K`}>
					<RadialDial
						ref={heatProgressRef}
						marker={(maxSafeHeat - nominalHeat) / (maxHeat - nominalHeat)}
						label=""
						count={(0 - nominalHeat) / (maxHeat - nominalHeat)}
						max={1}
						color="rgb(293,68,68)"
						backgroundColor="#888"
					>
						<Icon name="flame" />
					</RadialDial>
				</Tooltip>
				<Tooltip content={`Active Fuel: ${(fuel * 100).toFixed(0)}%`}>
					<RadialDial
						label=""
						count={fuel}
						max={1}
						color="rgb(221 107 32)"
						backgroundColor="#888"
					>
						<Icon name="atomic-slashes" />
					</RadialDial>
				</Tooltip>
				<Tooltip content={`Reserve Fuel: ${(reserve * 100).toFixed(0)}%`}>
					<RadialDial
						label=""
						count={reserve}
						max={1}
						color="rgb(49 151 149)"
						backgroundColor="#888"
					>
						<Icon name="database-zap" />
					</RadialDial>
				</Tooltip>
			</div>

			<div className="flex flex-col col-span-2 mt-2">
				<div className="flex-1 flex flex-wrap gap-y-1">
					{Array.from({
						length: desiredOutput,
					}).map((_, i) => (
						<Fragment key={i}>
							<div
								ref={(el) => el && elementRefs.current.set(i, el)}
								className={cn(
									"w-3 h-3 mr-1 last-of-type:mr-0 border-2 bg-gray-500",
									{
										"mr-0": i + 1 === maxOutput * optimalOutputPercent,
									},
								)}
							/>
							{i + 1 === maxOutput * optimalOutputPercent && (
								<Tooltip
									content="Optimal Output"
									tooltipClassName="-translate-y-1"
								>
									<div className="w-0.5 ml-px mr-px h-3 last-of-type:mr-0 bg-yellow-600 rounded" />
								</Tooltip>
							)}
						</Fragment>
					))}
				</div>
			</div>
		</div>
	);
}

function Battery({
	id,
	name,
	index,
	setSelectedPowerSupplier,
	selectedPowerSupplier,
	chargeRate,
	outputRate,
	capacity,
	cardLoaded,
}: {
	id: number;
	setSelectedPowerSupplier: Dispatch<SetStateAction<number | null>>;
	selectedPowerSupplier: number | null;
	name: string;
	index: number;
	chargeRate: number;
	outputRate: number;
	capacity: number;
	cardLoaded: boolean;
}) {
	const chargeElementRefs = useRef<Map<number, HTMLDivElement>>(new Map());
	const storageRef = useRef<HTMLDivElement>(null);
	const storageProgressRef = useRef<{ setValue: (value: number) => void }>(
		null,
	);
	const outputRef = useRef<HTMLDivElement>(null);
	const outputProgressRef = useRef<{ setValue: (value: number) => void }>(null);
	const batteryIconRef = useRef<{ setPercentage: (value: number) => void }>(
		null,
	);
	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const system = interpolate(id);
		if (!system) return;
		const storage = system.x;
		const chargeAmount = system.y;
		const dischargeAmount = system.z;
		for (const [i, el] of chargeElementRefs.current) {
			if (i + 1 <= Math.ceil(chargeAmount)) {
				el.classList.add("bg-yellow-400", "border-yellow-400");
				el.classList.remove("border-gray-500", "bg-gray-500");
			} else {
				el.classList.add("border-gray-500", "bg-gray-500");
				el.classList.remove("bg-yellow-400", "border-yellow-400");
			}
		}
		if (storageRef.current) {
			storageRef.current.innerText = `Storage: ${(
				(storage / capacity) *
				100
			).toFixed(0)}% (${storage.toFixed(2)}MWh)`;
		}
		if (storageProgressRef.current) {
			storageProgressRef.current.setValue(storage / capacity);
		}
		if (batteryIconRef.current) {
			batteryIconRef.current.setPercentage(storage / capacity);
		}
		if (outputRef.current) {
			outputRef.current.innerText = `Output: ${dischargeAmount.toFixed(2)}MW`;
		}
		if (outputProgressRef.current) {
			outputProgressRef.current.setValue(dischargeAmount / outputRate);
		}
	}, cardLoaded);

	return (
		<div
			onClick={() => setSelectedPowerSupplier(id)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					setSelectedPowerSupplier(id);
				}
			}}
			className={cn(
				"relative w-full flex flex-col items-start justify-start py-2 px-4 panel panel-warning col-start-2",
				{
					"brightness-150": selectedPowerSupplier === id,
				},
			)}
		>
			<div className="font-medium w-full gap-1 self-start flex items-center bg-green">
				<span className="truncate">
					{name} {index + 1}
				</span>
				<div className="flex-1" />

				<Tooltip ref={storageRef} content={`Storage:  MW`}>
					<RadialDial
						ref={storageProgressRef}
						label=""
						count={0}
						max={1}
						color="rgb(74,222,128)"
						backgroundColor="#888"
					>
						<BatteryIcon percentage={0} ref={batteryIconRef} />
					</RadialDial>
				</Tooltip>
				<Tooltip ref={outputRef} content={`Output:  MW`}>
					<RadialDial
						ref={outputProgressRef}
						label=""
						count={0}
						max={1}
						color="rgb(250,204,21)"
						backgroundColor="#888"
					>
						<Icon name="zap" />
					</RadialDial>
				</Tooltip>
			</div>
			<div className="flex w-full flex-col mt-2">
				<p>Power Input</p>
				<div className="flex gap-1 items-center">
					<Tooltip content="Remove Power">
						<Button
							className="btn-xs btn-primary"
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							<Icon name="minus" />
						</Button>
					</Tooltip>
					<div className="flex-1 flex flex-wrap gap-y-1">
						{Array.from({
							length: Math.floor(chargeRate),
						}).map((_, i) => (
							<div
								key={i}
								ref={(el) => el && chargeElementRefs.current.set(i, el)}
								className="w-3 h-3 mr-1 last-of-type:mr-0 border-2"
							/>
						))}
					</div>
					<Tooltip content="Allocate Power">
						<Button
							className="btn-xs btn-primary"
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							<Icon name="plus" />
						</Button>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}

function System({
	id,
	name,
	requestedPower,
	maxSafePower,
	requiredPower,
	efficiency,
	heat,
	maxSafeHeat,
	maxHeat,
	nominalHeat,
	cardLoaded,
}: {
	id: number;
	name: string;
	requestedPower: number;
	maxSafePower: number;
	requiredPower: number;
	efficiency?: number;
	heat?: number;
	maxSafeHeat?: number;
	maxHeat?: number;
	nominalHeat?: number;
	selectedSystem: number | null;
	setSelectedSystem: Dispatch<SetStateAction<number | null>>;
	cardLoaded: boolean;
}) {
	const elementRefs = useRef<Map<number, HTMLDivElement>>(new Map());
	const heatRef = useRef<HTMLDivElement>(null);
	const heatProgressRef = useRef<{ setValue: (value: number) => void }>(null);

	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const system = interpolate(id);
		if (!system) return;
		const currentPower = system.y;
		const heat = system.z;
		for (const [i, el] of elementRefs.current) {
			if (i + 1 <= Math.ceil(currentPower)) {
				el.classList.add("bg-yellow-400", "border-yellow-400");
				el.classList.remove("border-gray-500", "bg-gray-500");
			} else {
				el.classList.add("border-gray-500", "bg-gray-500");
				el.classList.remove("bg-yellow-400", "border-yellow-400");
			}
		}
		if (heatRef.current) {
			heatRef.current.innerText = `Heat: ${Math.round(heat)}K`;
		}
		if (heatProgressRef.current && nominalHeat && maxHeat) {
			heatProgressRef.current.setValue(
				(heat - nominalHeat) / (maxHeat - nominalHeat),
			);
		}
	}, cardLoaded);

	return (
		<div
			key={id}
			className="relative group transition-all cursor-pointer aria-expanded:cursor-default w-full h-fit p-2 panel panel-success flex flex-col justify-between"
		>
			<div className="font-medium w-full gap-1 self-start flex items-center">
				<span className="truncate">{name}</span>
				<div className="flex-1" />
				{typeof heat === "number" &&
				typeof nominalHeat === "number" &&
				maxHeat ? (
					<Tooltip ref={heatRef} content={`Heat: K`}>
						<RadialDial
							ref={heatProgressRef}
							marker={
								maxSafeHeat
									? (maxSafeHeat - nominalHeat) / (maxHeat - nominalHeat)
									: undefined
							}
							label=""
							count={(0 - nominalHeat) / (maxHeat - nominalHeat)}
							max={1}
							color="rgb(293,68,68)"
							backgroundColor="#888"
						>
							<Icon name="flame" />
						</RadialDial>
					</Tooltip>
				) : null}
				{typeof efficiency === "number" ? (
					<Tooltip content={`Efficiency: ${Math.round(efficiency * 100)}%`}>
						<RadialDial
							label=""
							count={efficiency}
							max={1}
							color="rgb(221 107 32)"
							backgroundColor="#888"
						>
							<Icon name="power-node" />
						</RadialDial>
					</Tooltip>
				) : null}
			</div>

			<div className="flex flex-col mt-2">
				<div className="flex gap-1 items-center">
					<Tooltip content="Remove Power">
						<Button className="btn-xs btn-primary">
							<Icon name="minus" />
						</Button>
					</Tooltip>
					<div className="flex-1 flex flex-wrap gap-y-1">
						{Array.from({
							length: Math.max(requestedPower, requiredPower),
						}).map((_, i) => (
							<Fragment key={i}>
								{/* Display a warning indicator if we're past the max safe power */}
								{i + 1 === maxSafePower + 1 && (
									<Tooltip content="Max Safe Power">
										<div className="w-0.5 ml-px mr-px h-3 last-of-type:mr-0 bg-red-500 rounded" />
									</Tooltip>
								)}
								<div
									ref={(el) => el && elementRefs.current.set(i, el)}
									className={cn("w-3 h-3 mr-1 last-of-type:mr-0 border-2", {
										"mr-0": i + 1 === requiredPower || i + 1 === maxSafePower,
									})}
								/>

								{i + 1 === requiredPower && (
									<Tooltip content="Required Power">
										<div className="w-0.5 ml-px mr-px h-3 last-of-type:mr-0 bg-yellow-500 rounded" />
									</Tooltip>
								)}
							</Fragment>
						))}
					</div>
					<Tooltip content="Allocate Power">
						<Button className="btn-xs btn-primary">
							<Icon name="plus" />
						</Button>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}

const BatteryIcon = forwardRef<
	{ setPercentage: (value: number) => void },
	{ percentage: number }
>(({ percentage }, ref) => {
	const batteryRef100 = useRef<HTMLDivElement>(null);
	const batteryRef75 = useRef<HTMLDivElement>(null);
	const batteryRef50 = useRef<HTMLDivElement>(null);
	const batteryRef25 = useRef<HTMLDivElement>(null);
	const batteryRef0 = useRef<HTMLDivElement>(null);

	useImperativeHandle(
		ref,
		() => ({
			setPercentage: (percentage: number) => {
				batteryRef100.current?.classList.add("hidden");
				batteryRef75.current?.classList.add("hidden");
				batteryRef50.current?.classList.add("hidden");
				batteryRef25.current?.classList.add("hidden");
				batteryRef0.current?.classList.add("hidden");
				switch (true) {
					case percentage > 0.95:
						batteryRef100.current?.classList.remove("hidden");
						break;
					case percentage > 0.6:
						batteryRef75.current?.classList.remove("hidden");
						break;
					case percentage > 0.4:
						batteryRef50.current?.classList.remove("hidden");
						break;
					case percentage > 0.1:
						batteryRef25.current?.classList.remove("hidden");
						break;
					default:
						batteryRef0.current?.classList.remove("hidden");
				}
			},
		}),
		[],
	);

	return (
		<>
			<div ref={batteryRef100} className={percentage < 0.95 ? "hidden" : ""}>
				<Icon name="battery-100" className="block" />
			</div>
			<div
				ref={batteryRef75}
				className={percentage >= 0.95 || percentage < 0.6 ? "hidden" : ""}
			>
				<Icon name="battery-75" className="block" />
			</div>
			<div
				ref={batteryRef50}
				className={percentage >= 0.6 || percentage < 0.4 ? "hidden" : ""}
			>
				<Icon name="battery-50" className="block" />
			</div>
			<div
				ref={batteryRef25}
				className={percentage >= 0.4 || percentage < 0.1 ? "hidden" : ""}
			>
				<Icon name="battery-25" className="block" />
			</div>
			<div ref={batteryRef0} className={percentage >= 0.1 ? "hidden" : ""}>
				<Icon name="battery-0" className="block" />
			</div>
		</>
	);
});

BatteryIcon.displayName = "BatteryIcon";
