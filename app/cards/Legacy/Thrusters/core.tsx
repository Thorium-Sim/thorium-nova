import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { InputField, OutputField } from "@thorium/ui/Core";
import { Icon } from "@thorium/ui/Icon";
import { Tooltip } from "@thorium/ui/Tooltip";

export function LegacyThrusterCore() {
	const { shipId } = useStation();
	const [thrusters] = q.legacy.thrusters.get.useNetRequest({ shipId });
	const { mutate: updateRotation } = q.legacy.thrusters.setRequiredRotation.useNetSend();
	const { mutate: updateRotationSpeed } = q.legacy.thrusters.setRotationSpeed.useNetSend();

	return (
		<div>
			<div className="grid grid-flow-col grid-cols-3 grid-rows-3 text-xs">
				<p>Yaw</p>
				<OutputField data-testid="yaw-value">{Math.round(thrusters.rotation.yaw)}˚</OutputField>
				<InputField
					data-testid="yaw-required"
					prompt="What is the required yaw?"
					promptValue={thrusters.requiredRotation.yaw}
					alert={Math.round(thrusters.rotation.yaw) !== Math.round(thrusters.requiredRotation.yaw)}
					onClick={(value) =>
						updateRotation({
							shipId,
							rotation: {
								yaw: Math.min(359, Math.max(0, Number(value) || 0)),
							},
						})
					}
				>
					{thrusters.requiredRotation.yaw}˚
				</InputField>

				<p>Pitch</p>
				<OutputField>{Math.round(thrusters.rotation.pitch)}˚</OutputField>
				<InputField
					prompt="What is the required pitch?"
					promptValue={thrusters.requiredRotation.pitch}
					alert={
						Math.round(thrusters.rotation.pitch) !== Math.round(thrusters.requiredRotation.pitch)
					}
					onClick={(value) =>
						updateRotation({
							shipId,
							rotation: {
								pitch: Math.min(359, Math.max(0, Number(value) || 0)),
							},
						})
					}
				>
					{thrusters.requiredRotation.pitch}˚
				</InputField>

				<p>Roll</p>
				<OutputField>{Math.round(thrusters.rotation.roll)}˚</OutputField>
				<InputField
					prompt="What is the required roll?"
					promptValue={thrusters.requiredRotation.roll}
					alert={
						Math.round(thrusters.rotation.roll) !== Math.round(thrusters.requiredRotation.roll)
					}
					onClick={(value) =>
						updateRotation({
							shipId,
							rotation: {
								roll: Math.min(359, Math.max(0, Number(value) || 0)),
							},
						})
					}
				>
					{thrusters.requiredRotation.roll}˚
				</InputField>
			</div>
			<div className="grid-f grid grid-cols-3 grid-rows-2 justify-items-center text-2xl">
				<Tooltip content="Down">
					<Icon
						data-testid="direction-down"
						style={{
							color: `oklch(${thrusters.direction.y * 0.6235} 0.2203 256.91)`,
						}}
						name="circle-arrow-down"
					/>
				</Tooltip>
				<Tooltip content="Forward">
					<Icon
						style={{
							color: `oklch(${thrusters.direction.z * 0.6235} 0.2203 256.91)`,
						}}
						name="arrow-up"
					/>
				</Tooltip>
				<Tooltip content="Up">
					<Icon
						data-testid="direction-up"
						style={{
							color: `oklch(${-thrusters.direction.y * 0.6235} 0.2203 256.91)`,
						}}
						name="circle-arrow-up"
					/>
				</Tooltip>
				<Tooltip content="Port">
					<Icon
						style={{
							color: `oklch(${thrusters.direction.x * 0.6235} 0.2203 256.91)`,
						}}
						name="arrow-left"
					/>
				</Tooltip>
				<Tooltip content="Reverse">
					<Icon
						style={{
							color: `oklch(${-thrusters.direction.z * 0.6235} 0.2203 256.91)`,
						}}
						name="arrow-down"
					/>
				</Tooltip>
				<Tooltip content="Starboard">
					<Icon
						style={{
							color: `oklch(${-thrusters.direction.x * 0.6235} 0.2203 256.91)`,
						}}
						name="arrow-right"
					/>
				</Tooltip>
			</div>
			<div className="flex gap-2 text-xs">
				<label htmlFor="rotation-speed" className="flex-1">
					Rotation Speed RPM
					<InputField
						id="rotation-speed"
						prompt="What would you like to change the rotation speed to?"
						promptValue={thrusters.rotationSpeed}
						onClick={(value) => updateRotationSpeed({ shipId, rotationSpeed: Number(value) || 5 })}
					>
						{thrusters.rotationSpeed}
					</InputField>
				</label>
				<label htmlFor="movement-speed" className="flex-1">
					Sensors Movement Speed
					<InputField
						id="movement-speed"
						prompt="What would you like to change the movement speed to?"
						onClick={(value) =>
							q.legacy.thrusters.setDirectionSpeed.netSend({
								shipId,
								directionSpeed: Number(value) || 5,
							})
						}
					>
						{thrusters.directionSpeed}
					</InputField>
				</label>
			</div>
		</div>
	);
}
