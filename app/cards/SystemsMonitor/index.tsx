import type { CardProps } from "@thorium/cards/CardProps";
import {
	systemCategories,
	systemFilterValues,
	systemPowerPriority,
} from "@thorium/cards/DamageReports/systemCategories";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import useEventListener from "@thorium/hooks/useEventListener";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { HoldButton } from "@thorium/ui/HoldButton";
import { Icon } from "@thorium/ui/Icon";
import RadialDial from "@thorium/ui/RadialDial";
import { SelectItem } from "@thorium/ui/Select";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import {
	Button as RAButton,
	ListBox,
	Popover,
	Select as RASelect,
	Label,
} from "react-aria-components";

export function SystemsMonitor({ cardLoaded }: CardProps) {
	const { shipId } = useStation();
	const [reactors] = q.systemsMonitor.reactors.get.useNetRequest({ shipId });
	const [batteries] = q.systemsMonitor.batteries.get.useNetRequest({ shipId });
	const [systems] = q.systemsMonitor.systems.get.useNetRequest({ shipId });

	const maxSystemPower = systems.reduce(
		(prev, next) =>
			typeof next.power?.powerLevels.at(-1) === "undefined" || prev > next.power.powerLevels.at(-1)!
				? prev
				: next.power.powerLevels.at(-1)!,
		0,
	);
	q.systemsMonitor.stream.useDataStream({ shipId });

	/**
	 *	Sort systems by
	 *   - Name
	 * 	 - Category
	 *   - Highest max power draw
	 *   - Activated/Deactivated
	 */

	const [selectedSort, setSelectedSort] = useState<
		"name" | "category" | "draw+" | "draw-" | "priority"
	>("category");

	const [powerDrawOrder, setPowerDrawOrder] = useState<number[]>([]);
	const { interpolate } = useLiveQuery();

	useAnimationFrame(() => {
		if (selectedSort === "category") {
			const newDrawOrder = systems
				.map((sys) => ({ id: sys.id, draw: interpolate(sys.id)?.y || 0 }))
				.sort((a, b) => b.draw - a.draw)
				.map((m) => m.id);
			if (newDrawOrder.join(",") !== powerDrawOrder.join(",")) setPowerDrawOrder(newDrawOrder);
		}
	}, cardLoaded);

	return (
		<div className="relative grid h-full grid-cols-[1fr_auto] items-center gap-2 text-sm">
			<div className="flex items-center justify-between gap-2">
				{reactors.map((reactor, i) => (
					<Reactor key={reactor.id} {...reactor} index={i} cardLoaded={cardLoaded} />
				))}
			</div>
			<ReactorSummary />
			<div className="flex items-center justify-between gap-2">
				{batteries.map((battery) => (
					<Battery {...battery} key={battery.id} />
				))}
			</div>
			<BatterySummary />
			<div
				className={cn(
					"panel panel-primary grid flex-auto grid-flow-col-dense gap-4 overflow-y-auto p-4 grid-rows-8",
				)}
			>
				{systems
					.concat()
					.sort((a, b) => {
						switch (selectedSort) {
							case "category":
								return (
									systemFilterValues.indexOf(systemCategories[a.type]) -
									systemFilterValues.indexOf(systemCategories[b.type])
								);
							case "name":
								return a.name.localeCompare(b.name);
							case "priority":
								return systemPowerPriority[a.type] - systemPowerPriority[b.type];
							case "draw+":
								return powerDrawOrder.indexOf(a.id) - powerDrawOrder.indexOf(b.id);
							case "draw-":
								return powerDrawOrder.indexOf(b.id) - powerDrawOrder.indexOf(a.id);
							default:
								return 0;
						}
					})
					.map((system) => (
						<System key={system.id} {...system} max={maxSystemPower} />
					))}
			</div>

			<div className="flex flex-col gap-2 self-end">
				<p>Sort:</p>
				<Button
					className={cn("btn-sm", {
						"btn-primary": selectedSort === "category",
						"btn-info": selectedSort !== "category",
					})}
					onClick={() => setSelectedSort("category")}
				>
					Category
				</Button>
				<Button
					className={cn("btn-sm", {
						"btn-primary": selectedSort === "name",
						"btn-info": selectedSort !== "name",
					})}
					onClick={() => setSelectedSort("name")}
				>
					Name
				</Button>
				<Button
					className={cn("btn-sm relative", {
						"btn-primary": selectedSort.startsWith("draw"),
						"btn-info": !selectedSort.startsWith("draw"),
					})}
					onClick={() => setSelectedSort((sort) => (sort === "draw+" ? "draw-" : "draw+"))}
				>
					Power Draw{" "}
					{selectedSort === "draw+" ? (
						<Icon name="arrow-up" className="absolute right-2" />
					) : selectedSort === "draw-" ? (
						<Icon name="arrow-down" className="absolute right-2" />
					) : null}
				</Button>
				<Button
					className={cn("btn-sm", {
						"btn-primary": selectedSort === "priority",
						"btn-info": selectedSort !== "priority",
					})}
					onClick={() => setSelectedSort("priority")}
				>
					Priority
				</Button>
			</div>
		</div>
	);
}

function Reactor({
	name,
	id,
	index,
	nominalHeat,
	maxSafeHeat,
	maxHeat,
	fuel,
	reserve,
	desiredOutput,
	maxOutput,
	optimalOutputPercent,
	efficiency,
	cardLoaded,
}: {
	name: string;
	id: number;
	index: number;
	nominalHeat: number;
	maxSafeHeat: number;
	maxHeat: number;
	fuel: number;
	reserve: number;
	desiredOutput: number;
	maxOutput: number;
	optimalOutputPercent: number;
	efficiency?: number;
	cardLoaded: boolean;
}) {
	const heatRef = useRef<HTMLDivElement>(null);
	const heatProgressRef = useRef<{ setValue: (value: number) => void }>(null);
	const powerProgressRef = useRef<HTMLDivElement>(null);
	const powerRef = useRef<HTMLDivElement>(null);
	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const reactor = interpolate(id);
		if (!reactor) return;

		if (powerProgressRef.current)
			powerProgressRef.current.style.width = `${(reactor.x / maxOutput) * 100}%`;
		if (powerRef.current)
			powerRef.current.textContent = `Current Output: ${Math.round(reactor.x * 10) / 10} MW`;
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
			key={id}
			className="panel panel-primary group relative grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-4 gap-x-2 overflow-hidden p-2 text-left"
		>
			<div className="col-span-4 flex items-center gap-1 self-start">
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
				<Tooltip content={`Active Fuel: ${(fuel * 100).toFixed(0)}%`}>
					<RadialDial label="" count={fuel} max={1} color="rgb(180 251 32)" backgroundColor="#888">
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
			<HoldButton
				className="btn-xs btn-circle btn-primary text-xl"
				clickAction={(actionCount) => {
					q.systemsMonitor.reactors.setDesiredOutput.netSend({
						reactorId: id,
						output: desiredOutput - actionCount,
					});
				}}
			>
				<Icon name="arrow-down" />
			</HoldButton>
			<Tooltip ref={powerRef} content={`Current Output: MW`}>
				<div className="progress-warning progress relative h-2 w-full overflow-hidden">
					<div className="absolute top-0 left-0 h-full bg-current" ref={powerProgressRef}></div>
					<div
						className="absolute top-0 left-0 h-full bg-current/50 transition-[width]"
						style={{
							width: `${(desiredOutput / maxOutput) * 100}%`,
						}}
					></div>
					<div
						className="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-green-500"
						style={{ left: `${optimalOutputPercent * 100}%` }}
					/>
				</div>
			</Tooltip>
			<HoldButton
				className="btn-xs btn-circle btn-primary text-xl"
				clickAction={(actionCount) => {
					q.systemsMonitor.reactors.setDesiredOutput.netSend({
						reactorId: id,
						output: desiredOutput + actionCount,
					});
				}}
			>
				<Icon name="arrow-up" />
			</HoldButton>
			<p className="tabular-nums">
				<span className="inline-block min-w-[2ch] text-right">{desiredOutput}</span> / {maxOutput}{" "}
				MW
			</p>
		</div>
	);
}

function ReactorSummary() {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();
	const [reactors] = q.systemsMonitor.reactors.get.useNetRequest({ shipId });
	const [systems] = q.systemsMonitor.systems.get.useNetRequest({ shipId });
	const [batteries] = q.systemsMonitor.batteries.get.useNetRequest({ shipId });

	const outputRef = useRef<HTMLSpanElement>(null);
	const netOutputRef = useRef<HTMLSpanElement>(null);
	const usedRef = useRef<HTMLSpanElement>(null);
	const { interpolate } = useLiveQuery();

	useAnimationFrame(() => {
		let output = 0;
		for (const reactor of reactors) {
			const reactorData = interpolate(reactor.id);
			if (!reactorData) continue;
			output += reactorData.x;
		}
		if (outputRef.current) outputRef.current.textContent = `${Math.round(output * 10) / 10}`;

		let used = 0;
		for (const system of systems) {
			const systemData = interpolate(system.id);
			if (!systemData) continue;
			used += systemData.y;
		}
		if (usedRef.current) usedRef.current.textContent = `${Math.round(used * 10) / 10}`;

		let batteryUsage = 0;
		for (const battery of batteries) {
			const batteryData = interpolate(battery.id);
			if (!batteryData) continue;
			batteryUsage += batteryData.z;
		}
		if (netOutputRef.current)
			netOutputRef.current.textContent = `${Math.round((used - batteryUsage) * 10) / 10}`;
	}, cardLoaded);

	return (
		<div>
			<p className="text-right whitespace-nowrap tabular-nums">
				Total Output: <span ref={outputRef} className="inline-block w-[3ch] text-right" /> MW
			</p>
			<p className="text-right whitespace-nowrap tabular-nums">
				Net Output: <span ref={netOutputRef} className="inline-block w-[3ch] text-right" /> MW
			</p>
			<p className="text-right whitespace-nowrap tabular-nums">
				Total Used: <span ref={usedRef} className="inline-block w-[3ch] text-right" /> MW
			</p>
		</div>
	);
}

function BatterySummary() {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();
	const [batteries] = q.systemsMonitor.batteries.get.useNetRequest({ shipId });

	const inputRef = useRef<HTMLSpanElement>(null);
	const outputRef = useRef<HTMLSpanElement>(null);
	const chargeRef = useRef<HTMLSpanElement>(null);
	const { interpolate } = useLiveQuery();

	useAnimationFrame(() => {
		let batteryOutput = 0;
		let batteryInput = 0;
		for (const battery of batteries) {
			const batteryData = interpolate(battery.id);
			if (!batteryData) continue;
			batteryInput += batteryData.y;
			batteryOutput += batteryData.z;
		}
		if (outputRef.current) outputRef.current.textContent = `${Math.round(batteryOutput * 10) / 10}`;
		if (inputRef.current) inputRef.current.textContent = `${Math.round(batteryInput * 10) / 10}`;
		if (chargeRef.current)
			chargeRef.current.textContent = `${Math.round((batteryInput - batteryOutput) * 10) / 10}`;
	}, cardLoaded);

	return (
		<div>
			<p className="text-right whitespace-nowrap tabular-nums">
				Battery Input: <span ref={inputRef} className="inline-block w-[3ch] text-right" /> MW
			</p>
			<p className="text-right whitespace-nowrap tabular-nums">
				Battery Output: <span ref={outputRef} className="inline-block w-[3ch] text-right" /> MW
			</p>
			<p className="text-right whitespace-nowrap tabular-nums">
				Net Change: <span ref={chargeRef} className="inline-block w-[4ch] text-right" /> MW
			</p>
		</div>
	);
}

class HoverBatteryEvent extends Event {
	static name = "hover-battery-event";
	constructor(public batteryId: number | null) {
		super(HoverBatteryEvent.name);
	}
}

function Battery({
	id,
	name,
	outputRate,
	capacity,
}: {
	id: number;
	name: string;
	outputRate: number;
	capacity: number;
}) {
	const { cardLoaded } = useCardContext();
	const storageRef = useRef<HTMLDivElement>(null);
	const storageNumberRef = useRef<HTMLSpanElement>(null);
	const storageProgressRef = useRef<HTMLDivElement>(null);
	const outputRef = useRef<HTMLDivElement>(null);
	const outputProgressRef = useRef<HTMLDivElement>(null);
	const outputNumberRef = useRef<HTMLSpanElement>(null);

	const chargingRef = useRef<SVGSVGElement>(null);
	const equalRef = useRef<SVGSVGElement>(null);
	const dischargingRef = useRef<SVGSVGElement>(null);
	const chargeLabelRef = useRef<HTMLDivElement>(null);
	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const system = interpolate(id);
		if (!system) return;
		const storage = system.x;
		const chargeAmount = system.y;
		const dischargeAmount = system.z;

		if (storageRef.current) {
			storageRef.current.innerText = `Storage: ${((storage / capacity) * 100).toFixed(
				0,
			)}% (${storage.toFixed(2)} MWh)`;
		}
		if (storageNumberRef.current) {
			storageNumberRef.current.textContent = `${Math.round(storage * 10) / 10}`;
		}
		if (storageProgressRef.current) {
			storageProgressRef.current.style.width = `${(storage / capacity) * 100}%`;
		}
		if (outputRef.current) {
			outputRef.current.innerText = `Output: ${Math.round(dischargeAmount * 10) / 10} MW`;
		}
		if (outputProgressRef.current) {
			outputProgressRef.current.style.width = `${(dischargeAmount / outputRate) * 100}%`;
		}
		if (outputNumberRef.current) {
			outputNumberRef.current.textContent = `${Math.round(dischargeAmount * 10) / 10}`;
		}

		if (chargeAmount > dischargeAmount) {
			chargingRef.current?.classList.remove("hidden");
			dischargingRef.current?.classList.add("hidden");
			equalRef.current?.classList.add("hidden");
		}
		if (chargeAmount < dischargeAmount) {
			chargingRef.current?.classList.add("hidden");
			dischargingRef.current?.classList.remove("hidden");
			equalRef.current?.classList.add("hidden");
		}
		if (chargeAmount === dischargeAmount) {
			chargingRef.current?.classList.add("hidden");
			dischargingRef.current?.classList.add("hidden");
			equalRef.current?.classList.remove("hidden");
		}
		if (chargeLabelRef.current) {
			chargeLabelRef.current.textContent = `Net Change: ${Math.round((chargeAmount - dischargeAmount) * 10) / 10} MW`;
		}
	}, cardLoaded);

	const [hovered, setHovered] = useState(false);
	useEventListener(HoverBatteryEvent.name, (event: HoverBatteryEvent) => {
		if (event.batteryId === id) setHovered(true);
		else setHovered(false);
	});

	return (
		<div
			className={cn(
				"panel panel-primary relative grid w-full grid-cols-[1fr_auto] items-center gap-x-2 p-2",
				{ "brightness-150": hovered },
			)}
		>
			<span className="truncate font-medium">{name}</span>
			<Tooltip ref={chargeLabelRef} content={`Net Change: MW`}>
				<div className="flex aspect-square h-5 w-5 items-center justify-center place-self-end rounded-full border text-sm">
					<Icon className="hidden" ref={chargingRef} name="arrow-up" />
					<Icon className="hidden" ref={equalRef} name="equal" />
					<Icon className="hidden" ref={dischargingRef} name="arrow-down" />
				</div>
			</Tooltip>
			{/* <BatteryIcon /> */}
			<Tooltip ref={storageRef} content={`Storage: MWh`}>
				<div className="progress-success progress relative h-2 w-full overflow-hidden">
					<div className="absolute top-0 left-0 h-full bg-current" ref={storageProgressRef}></div>
				</div>
			</Tooltip>

			<p className="text-right tabular-nums">
				<span className="inline-block min-w-[2ch] text-right" ref={storageNumberRef}></span> /{" "}
				{capacity} MWh
			</p>
			<Tooltip ref={outputRef} content={`Storage: MWh`}>
				<div className="progress-warning progress relative h-2 w-full overflow-hidden">
					<div className="absolute top-0 left-0 h-full bg-current" ref={outputProgressRef}></div>
				</div>
			</Tooltip>
			<p className="text-right tabular-nums">
				<span className="inline-block min-w-[2.5ch] text-right" ref={outputNumberRef}></span> /{" "}
				{outputRate} MW
			</p>
		</div>
	);
}

function System({
	id,
	name,
	power,
	heat,
	max,
}: {
	id: number;
	name: string;
	power?: { powerLevels: number[]; batterySource: number | null; activated: boolean };
	heat?: {
		heat: number;
		maxSafeHeat: number;
		maxHeat: number;
		nominalHeat: number;
	};
	max: number;
}) {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();
	const [batteries] = q.systemsMonitor.batteries.get.useNetRequest({ shipId });

	const heatRef = useRef<HTMLDivElement>(null);
	const heatProgressRef = useRef<{ setValue: (value: number) => void }>(null);
	const powerRef = useRef<HTMLDivElement>(null);
	const powerProgressRef = useRef<HTMLDivElement>(null);
	const powerNumberRef = useRef<HTMLSpanElement>(null);
	const batteryRef = useRef<{
		setPercentage: (value: number) => void;
	}>(null);

	const connectedBattery = batteries.find((b) => b.id === power?.batterySource);

	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const system = interpolate(id);
		if (!system) return;
		const currentPower = system.y;
		const heatValue = system.z;

		if (heatRef.current) {
			heatRef.current.innerText = `Heat: ${Math.round(heatValue)}K`;
		}
		if (heatProgressRef.current && heat) {
			heatProgressRef.current.setValue(
				(heatValue - heat.nominalHeat) / (heat.maxHeat - heat.nominalHeat),
			);
		}

		if (power) {
			if (powerRef.current)
				powerRef.current.textContent = `Power Draw: ${Math.round(currentPower * 100) / 100} MW`;
			if (powerProgressRef.current)
				powerProgressRef.current.style.width = `${(currentPower / max) * 100}%`;
			if (powerNumberRef.current)
				powerNumberRef.current.textContent = `${Math.round(currentPower * 10) / 10}`;

			if (connectedBattery) {
				batteryRef.current?.setPercentage(connectedBattery.storage / connectedBattery.capacity);
			}
		}
	}, cardLoaded);

	if (!power && !heat) return null;
	return (
		<div key={id} className="relative w-full items-center text-left">
			<div className="flex items-center gap-2">
				<span
					className={cn("flex-auto truncate text-sm", {
						"opacity-70": power && !power.activated && !power.batterySource,
					})}
				>
					{name}
				</span>
				{heat ? (
					<Tooltip ref={heatRef} content={`Heat: K`}>
						<RadialDial
							ref={heatProgressRef}
							marker={(heat.maxSafeHeat - heat.nominalHeat) / (heat.maxHeat - heat.nominalHeat)}
							label=""
							count={(0 - heat.nominalHeat) / (heat.maxHeat - heat.nominalHeat)}
							max={1}
							color="rgb(293,68,68)"
							backgroundColor="#888"
						>
							<Icon name="flame" />
						</RadialDial>
					</Tooltip>
				) : null}
				{power ? (
					<>
						<RASelect
							id={`${id}`}
							value={power.batterySource}
							onChange={(value) =>
								typeof value !== "string" &&
								q.systemsMonitor.systems.setBatterySource.netSend({
									systemId: id,
									batterySource: value,
								})
							}
						>
							<Label className="sr-only">Choose Connected Battery</Label>
							<RAButton
								className={cn("btn btn-xs btn-circle", {
									"btn-success": connectedBattery,
									"btn-info": !connectedBattery,
								})}
								aria-label={connectedBattery?.name || "None"}
								onPointerEnter={() => {
									if (connectedBattery)
										window.dispatchEvent(new HoverBatteryEvent(connectedBattery.id));
								}}
								onPointerLeave={() => {
									window.dispatchEvent(new HoverBatteryEvent(null));
								}}
							>
								{connectedBattery ? (
									<BatteryIcon
										percentage={connectedBattery.storage / connectedBattery.capacity}
										ref={batteryRef}
									/>
								) : (
									<Icon name="battery-off" />
								)}
							</RAButton>
							<Popover className={popoverTransitionClasses}>
								<ListBox className="select-options ring-opacity-5 data-[focused]:ring-opacity-50 isolate max-h-96 w-fit min-w-32 overflow-y-auto rounded-md bg-gray-900 px-2 py-1 text-sm text-white shadow-lg ring-2 ring-gray-400 outline-none">
									<SelectItem id={-1} label="None" />
									{batteries.map((b) => (
										<SelectItem key={b.id} id={b.id} label={b.name} />
									))}
								</ListBox>
							</Popover>
						</RASelect>
						{power.activated ? (
							<Button
								className="btn-xs btn-circle btn-primary"
								onClick={() =>
									q.systemsMonitor.systems.setActivated.netSend({ systemId: id, activated: false })
								}
							>
								<Icon name="power" />
							</Button>
						) : (
							<Button
								className="btn-xs btn-circle btn-error"
								onClick={() =>
									q.systemsMonitor.systems.setActivated.netSend({ systemId: id, activated: true })
								}
							>
								<Icon name="power-off" />
							</Button>
						)}
					</>
				) : null}
			</div>

			{power ? (
				<div className="flex items-center gap-2">
					<Tooltip ref={powerRef} className="flex-auto" content={`Power Draw: MW`}>
						<div className="progress-warning progress relative h-2 w-full overflow-hidden bg-transparent">
							<div
								className="absolute top-0 left-0 h-full bg-current/20"
								style={{
									width: `${(power.powerLevels[power.powerLevels.length - 1] / max) * 100}%`,
								}}
							/>
							<div className="absolute top-0 left-0 h-full bg-current" ref={powerProgressRef}></div>
							{power.powerLevels.map((l, i, arr) =>
								i === arr.length - 1 ? null : (
									<div
										key={i}
										className="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-yellow-500"
										style={{ left: `${(l / max) * 100}%` }}
									/>
								),
							)}
						</div>
					</Tooltip>
					<p className="text-sm tabular-nums">
						<span className="inline-block min-w-[2ch] text-right" ref={powerNumberRef}></span> /{" "}
						{power.powerLevels.at(-1)} MWh
					</p>
				</div>
			) : null}
		</div>
	);
}

function BatteryIcon({
	percentage,
	ref,
}: {
	percentage: number;
	ref: Ref<{ setPercentage: (value: number) => void }>;
}) {
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
			<div ref={batteryRef75} className={percentage >= 0.95 || percentage < 0.6 ? "hidden" : ""}>
				<Icon name="battery-75" className="block" />
			</div>
			<div ref={batteryRef50} className={percentage >= 0.6 || percentage < 0.4 ? "hidden" : ""}>
				<Icon name="battery-50" className="block" />
			</div>
			<div ref={batteryRef25} className={percentage >= 0.4 || percentage < 0.1 ? "hidden" : ""}>
				<Icon name="battery-25" className="block" />
			</div>
			<div ref={batteryRef0} className={percentage >= 0.1 ? "hidden" : ""}>
				<Icon name="battery-0" className="block" />
			</div>
		</>
	);
}
