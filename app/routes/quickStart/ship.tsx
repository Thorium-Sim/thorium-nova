import { q } from "@thorium/context/AppContext";
import {
	useFlightQuickStart,
	type FlightConfigAction,
} from "@thorium/routes/quickStart/quickStartContext";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import SearchableList from "@thorium/ui/SearchableList";
import { cn } from "@thorium/utils/cn";
import { randomNameGenerator } from "@thorium/utils/operations/randomNameGenerator";
import * as React from "react";
import {
	type Key,
	Label,
	Radio,
	RadioGroup,
	Tab,
	TabList,
	TabPanel,
	Tabs,
} from "react-aria-components";

interface Ship {
	id: string;
	name: string;
	shipId: { pluginId: string; shipId: string };
	crewCount: number;
}
const FleetConfig = () => {
	const [state, dispatch] = useFlightQuickStart();
	const [pluginShips] = q.plugin.ship.available.useNetRequest();

	if (!pluginShips)
		return <div>No ships are present in the active plugins.</div>;

	const ships = state.ships || [];
	return (
		<div className="w-[40vw]">
			<Input
				className="mb-4"
				label="Flight Name"
				value={state.flightName}
				onChange={(e) => dispatch({ type: "flightName", name: e.target.value })}
				inputButton={
					<Button
						className="btn-sm btn-outline btn-notice"
						onClick={() =>
							dispatch({ type: "flightName", name: randomNameGenerator() })
						}
					>
						<Icon name="repeat-2" width="2rem" />
					</Button>
				}
			/>
			<RadioGroup
				className="mb-4"
				value={state.mode}
				onChange={(mode) =>
					dispatch({ type: "mode", mode: mode as "nova" | "legacy" })
				}
			>
				<Label>Mode</Label>
				<div className="flex gap-2">
					<Radio
						value="nova"
						className={({ isSelected, isPressed, isFocusVisible }) =>
							cn("flex-auto p-4 border border-white/30 rounded", {
								"bg-purple-500/10 border-purple-500": isSelected,
								"bg-purple-500/20": isPressed,
								"ring ring-purple-100": isFocusVisible,
							})
						}
					>
						<div className="text-lg flex justify-between">
							Nova
							<InfoTip>
								Currently under development. Play Thorium in a realistic
								simulation. 3D space, ship systems, heat, power distribution,
								crew members, NPC ships, and everything else is modeled and
								simulated. Once you understand the rules of the simulation, you
								can exploit them to your advantage. Flight Director optional.
							</InfoTip>
						</div>
					</Radio>
					<Radio
						value="legacy"
						className={({ isSelected, isPressed, isFocusVisible }) =>
							cn("flex-auto p-4 border border-white/30 rounded", {
								"bg-purple-500/10 border-purple-500": isSelected,
								"bg-purple-500/20": isPressed,
								"ring ring-purple-100": isFocusVisible,
							})
						}
					>
						<div className="text-lg flex justify-between">
							Legacy
							<InfoTip>
								Currently under development. Grab a Flight Director and play
								Thorium more like a tabletop roleplaying game. The Flight
								Director controls the entire simulation, which is more ephemeral
								and less fixed. Great if you have an experienced Flight Director
								or want to have experiences that aren't possible in the Nova
								game engine.
							</InfoTip>
						</div>
					</Radio>
				</div>
			</RadioGroup>
			<div className="mt-1">
				<Checkbox
					label="Use Flight Director controls"
					checked={state.hasFlightDirector}
					disabled={state.mode === "legacy"}
					onChange={(e) =>
						dispatch({
							type: "hasFlightDirector",
							hasFlightDirector: e.target.checked,
						})
					}
				/>
			</div>
			<h2 className="text-2xl font-medium mt-4">Ships</h2>
			{ships.length === 1 ? (
				<ShipConfig key={ships[0].id} dispatch={dispatch} ship={ships[0]} />
			) : ships.length > 1 ? (
				<ShipsList ships={ships} dispatch={dispatch} />
			) : (
				<p>No player ships</p>
			)}
		</div>
	);
};

function ShipsList({
	ships,
	dispatch,
}: { dispatch: React.Dispatch<FlightConfigAction>; ships: Ship[] }) {
	const [selectedKey, onSelectionChange] = React.useState<Key>(ships[0].id);
	return (
		<Tabs selectedKey={selectedKey} onSelectionChange={onSelectionChange}>
			<TabList aria-label="Player Ships" className="flex gap-1 flex-wrap">
				{ships.map((ship) => (
					<Tab
						id={ship.id}
						key={ship.id}
						className="px-2 rounded-t bg-gray-700 data-[selected]:bg-notice"
					>
						{ship.name}
					</Tab>
				))}
			</TabList>
			{ships.map((ship) => (
				<TabPanel
					id={ship.id}
					key={ship.id}
					className="w-[24rem] max-w-[24rem]"
				>
					<ShipConfig dispatch={dispatch} ship={ship} />
					{ships.length > 1 && (
						<Button
							className="btn-error btn-sm mt-2"
							onClick={() => {
								dispatch({ type: "removeShip", id: ship.id });
								onSelectionChange(ships[0].id);
							}}
						>
							Remove
						</Button>
					)}
				</TabPanel>
			))}
		</Tabs>
	);
}
function ShipConfig({
	dispatch,
	ship,
}: {
	ship: Ship;
	dispatch: React.Dispatch<FlightConfigAction>;
}) {
	const [pickingShip, setPickingShip] = React.useState(false);
	const [pluginShips] = q.plugin.ship.available.useNetRequest();
	const [availableStations] = q.station.available.useNetRequest();

	const availableCrewSizes = availableStations
		.map((station) => station.stationCount)
		.filter((a, i, arr) => arr.indexOf(a) === i)
		.sort();

	const pickedShip = pluginShips.find(
		(pluginShip) =>
			pluginShip.pluginName === ship.shipId?.pluginId &&
			pluginShip.name === ship.shipId?.shipId,
	);

	return (
		<div>
			<div className="flex gap-4">
				<Input
					placeholder="Ship Name Here"
					className="mb-4"
					label="Ship Name"
					labelHidden={false}
					value={ship.name}
					onChange={(e) =>
						dispatch({ type: "shipName", id: ship.id, name: e.target.value })
					}
				/>
				<div>
					<p className="text-nowrap">Crew Count</p>
					<div className="flex justify-around items-center select-none">
						<button
							className="text-2xl cursor-pointer hover:text-white/80 active:text-white/50 focus:outline-none focus:ring rounded-full appearance-none"
							onClick={() =>
								dispatch({
									type: "increaseCrewCount",
									id: ship.id,
									availableCrewSizes,
								})
							}
						>
							<Icon name="arrow-up" />
						</button>
						<div className="flex justify-center tabular-nums w-8 h-8 items-center border-2 border-white/60 rounded-lg px-2">
							{ship.crewCount}
						</div>
						<button
							className="text-2xl cursor-pointer hover:text-white/80 active:text-white/50 focus:outline-none focus:ring rounded-full appearance-none"
							onClick={() =>
								dispatch({
									type: "decreaseCrewCount",
									id: ship.id,
									availableCrewSizes,
								})
							}
						>
							<Icon name="arrow-down" />
						</button>
					</div>
				</div>
			</div>
			{pickingShip ? (
				<div className="h-64">
					<SearchableList
						selectedItem={ship.shipId}
						setSelectedItem={({ id }) => {
							dispatch({ type: "shipId", id: ship.id, shipId: id });
							setPickingShip(false);
						}}
						items={pluginShips.map((item) => ({
							id: { shipId: item.name, pluginId: item.pluginName },
							label: item.name,
							description: item.description,
							category: item.pluginName,
							image: item.vanityUrl,
						}))}
						renderItem={(item) => (
							<div className="flex gap-2">
								<img src={item.image} alt={item.label} className="h-12 w-12" />
								<div>
									<p className="font-bold">{item.label}</p>
									<p>{item.description}</p>
								</div>
							</div>
						)}
					/>
				</div>
			) : (
				<button
					className="p-2 border border-white/30 rounded-lg hover:bg-white/10 cursor-pointer w-full text-left flex gap-2"
					type="button"
					onClick={() => setPickingShip(true)}
				>
					<img
						src={pickedShip?.vanityUrl}
						alt={pickedShip?.name}
						className="h-12 w-12"
					/>
					<div className="flex-auto">
						<p className="font-bold">{pickedShip?.name}</p>
						<p>{pickedShip?.description}</p>
					</div>
				</button>
			)}
		</div>
	);
}

export default FleetConfig;
