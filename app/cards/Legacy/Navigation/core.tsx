import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { OutputField } from "@thorium/ui/Core";
import { Icon } from "@thorium/ui/Icon";
import { useState } from "react";

export function LegacyNavigationCore() {
	const { shipId } = useStation();

	const [navigation] = q.legacy.navigation.navigation.useNetRequest({ shipId });
	const [newCourse, setNewCourse] = useState(navigation.calculatedCourse);
	return (
		<div className="text-xs">
			<div className="flex gap-4">
				<Checkbox
					label="Calculate"
					checked={navigation.calculate}
					onChange={(event) =>
						q.legacy.navigation.update.netSend({
							shipId,
							calculate: event.target.checked,
						})
					}
				/>
				<Checkbox
					label="Thrusters"
					checked={navigation.thrusters}
					onChange={(event) =>
						q.legacy.navigation.update.netSend({
							shipId,
							thrusters: event.target.checked,
						})
					}
				/>
			</div>
			<div className="grid w-full grid-flow-col grid-cols-[6ch_1fr_1fr_1fr_1fr] grid-rows-5 gap-x-1">
				<div className="row-start-2 text-right">{navigation.thrusters ? "Yaw" : "X"}</div>
				<div className="text-right">{navigation.thrusters ? "Pitch" : "Y"}</div>
				<div className="text-right">{navigation.thrusters ? "Roll" : "Z"}</div>

				<OutputField className="col-span-5" alert={navigation.scanning}>
					{navigation.destination}
				</OutputField>
				<p>Current</p>
				<OutputField alert={navigation.currentCourse.x !== navigation.calculatedCourse.x}>
					{navigation.currentCourse.x}
				</OutputField>
				<OutputField alert={navigation.currentCourse.y !== navigation.calculatedCourse.y}>
					{navigation.currentCourse.y}
				</OutputField>
				<OutputField alert={navigation.currentCourse.z !== navigation.calculatedCourse.z}>
					{navigation.currentCourse.z}
				</OutputField>
				<p>New</p>
				<input
					className="w-full border border-gray-700 bg-slate-400 text-center text-black"
					onChange={(event) =>
						setNewCourse((course) => ({
							...course,
							x: event.currentTarget.value,
						}))
					}
					value={newCourse.x}
				/>
				<input
					className="w-full border border-gray-700 bg-slate-400 text-center text-black"
					onChange={(event) =>
						setNewCourse((course) => ({
							...course,
							y: event.currentTarget.value,
						}))
					}
					value={newCourse.y}
				/>
				<input
					className="w-full border border-gray-700 bg-slate-400 text-center text-black"
					onChange={(event) =>
						setNewCourse((course) => ({
							...course,
							z: event.currentTarget.value,
						}))
					}
					value={newCourse.z}
				/>

				<Button
					className="btn-xs btn-info row-start-2"
					onClick={() =>
						setNewCourse({
							x: (Math.round(Math.random() * 100000) / 100).toFixed(2),
							y: (Math.round(Math.random() * 100000) / 100).toFixed(2),
							z: (Math.round(Math.random() * 100000) / 100).toFixed(2),
						})
					}
				>
					<Icon name="shuffle" />
				</Button>
				<Button
					className="btn-xs col-span-2"
					onClick={() =>
						setNewCourse({
							x: "No",
							y: "Course",
							z: "Available",
						})
					}
				>
					Unknown
				</Button>
				<Button
					className="btn-xs btn-primary col-span-2"
					onClick={() =>
						q.legacy.navigation.courseResult.netSend({
							shipId,
							result: newCourse,
						})
					}
				>
					Send
				</Button>

				<Button
					className="btn-xs btn-warning row-start-2"
					onClick={() =>
						setNewCourse({
							x: `${Math.round(Math.random() * 360)}˚`,
							y: `${Math.round(Math.random() * 360)}˚`,
							z: `${Math.round(Math.random() * 360)}˚`,
						})
					}
				>
					<Icon name="repeat-2" />
				</Button>
			</div>
		</div>
	);
}
