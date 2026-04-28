import Checkbox from "@thorium/ui/Checkbox";
import Input from "@thorium/ui/Input";
import type { LightMinute } from "@thorium/utils/unitTypes";
import { lightMinuteToLightYear, lightYearToLightMinute } from "@thorium/utils/unitTypes";
import debounce from "lodash.debounce";
import * as React from "react";
import { useEffect } from "react";

import { useGetStarmapStore } from "./starmapStore";

export const InterstellarPalette = ({
	selectedStar,
	update,
}: {
	selectedStar: {
		name: string;
		position: Record<"x" | "y" | "z", LightMinute>;
		description: string;
		commSatellite: boolean;
		commSatelliteRadius?: number;
	};
	update: (params: {
		name?: string | undefined;
		description?: string | undefined;
		commSatellite?: boolean;
		commSatelliteRadius?: number;
		position?: { x: number; y: number; z: number };
	}) => Promise<void>;
}) => {
	const useStarmapStore = useGetStarmapStore();

	useEffect(() => {
		if (!selectedStar) {
			useStarmapStore.setState({ selectedObjectIds: [] });
		}
	}, [selectedStar, useStarmapStore]);

	const [name, setName] = React.useState(selectedStar?.name || "");
	const [description, setDescription] = React.useState(selectedStar?.description || "");

	const debouncedUpdate = React.useMemo(
		() => debounce(update, 500, { maxWait: 2000, trailing: true }),
		[update],
	);

	useEffect(() => {
		if (!selectedStar) return;
		setName(selectedStar.name);
		setDescription(selectedStar.description);
	}, [selectedStar, selectedStar?.name, selectedStar?.description]);

	return (
		<div className="h-full w-full overflow-y-auto p-2 text-white" key={selectedStar?.name}>
			<Input
				label="Name"
				value={name}
				onChange={(e) => {
					setName(e.target.value);
					debouncedUpdate({ name: e.target.value });
				}}
				name="name"
			/>
			<Input
				label="Description"
				as="textarea"
				rows={5}
				className="resize-none"
				value={description}
				onChange={(e) => {
					setDescription(e.target.value);
					debouncedUpdate({ description: e.target.value });
				}}
				name="description"
			/>
			<label>Position</label>
			<div className="flex gap-0.5">
				<input
					className="input flex-1"
					inputMode="numeric"
					pattern="[0-9]*"
					defaultValue={lightMinuteToLightYear(selectedStar.position.x)}
					onChange={(e) => {
						update({
							position: {
								...selectedStar.position,
								x: lightYearToLightMinute(Number(e.currentTarget.value)),
							},
						});
					}}
				></input>
				<input
					className="input flex-1"
					inputMode="numeric"
					pattern="[0-9]*"
					defaultValue={lightMinuteToLightYear(selectedStar.position.y)}
					onChange={(e) => {
						update({
							position: {
								...selectedStar.position,
								y: lightYearToLightMinute(Number(e.currentTarget.value)),
							},
						});
					}}
				></input>
				<input
					className="input flex-1"
					inputMode="numeric"
					pattern="[0-9]*"
					defaultValue={lightMinuteToLightYear(selectedStar.position.z)}
					onChange={(e) => {
						update({
							position: {
								...selectedStar.position,
								z: lightYearToLightMinute(Number(e.currentTarget.value)),
							},
						});
					}}
				></input>
			</div>
			<Checkbox
				label="Comm Satellite"
				defaultChecked={selectedStar?.commSatellite}
				onChange={(e) => update({ commSatellite: e.currentTarget.checked })}
			/>
			{selectedStar.commSatellite && (
				<Input
					label="Comm Satellite Radius"
					helperText="The radius for how far this comm satellite can receive messages, in light years"
					inputMode="numeric"
					pattern="[0-9]*"
					key={selectedStar?.name}
					defaultValue={selectedStar.commSatelliteRadius}
					onChange={(e) => {
						update({ commSatelliteRadius: Number(e.currentTarget.value) });
					}}
					name="description"
				/>
			)}
		</div>
	);
};
