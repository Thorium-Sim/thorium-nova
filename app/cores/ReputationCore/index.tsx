import { q } from "@thorium/context/AppContext";
import { pickStarmapShip } from "@thorium/cores/StarmapCore/pickShip";
import { useStation } from "@thorium/routes/station/useStation";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";

export function ReputationCore() {
	const { shipId: id } = useStation();
	const [reputation] = q.starmapCore.reputation.useNetRequest({ entityId: id });
	const prompt = usePrompt();
	return (
		<div className="mt-1 px-2">
			{reputation.length === 0 ? (
				<p>No reputation</p>
			) : (
				reputation.map(({ id: targetId, name, value }) => {
					return (
						<div key={name} className="flex">
							<label className="flex-1" htmlFor={`reputation-${targetId}`}>
								{name}
							</label>
							<input id={`reputation-${targetId}`} className="input input-xs w-24" value={value} />
							<Button
								className="btn-xs btn-warning"
								onClick={async () => {
									const stringValue = await prompt({
										header: "Set Reputation",
										body: "Enter the reputation value. 0 is neutral, positive is favorable, negative is unfavorable",
										defaultValue: value.toString(),
									});
									if (stringValue === null) return;
									const newValue = Number(stringValue);
									if (Number.isNaN(newValue)) {
										return;
									}
									q.starmapCore.setReputation.netSend({
										entityId: id,
										targetId,
										value: newValue,
									});
								}}
							>
								<Icon name="pencil" />
							</Button>
						</div>
					);
				})
			)}
			<div className="mt-1 flex justify-between gap-1">
				<Button
					className="btn-xs btn-primary flex-1"
					onClick={() =>
						pickStarmapShip("Choose a ship or faction to become friends with.", (object) => {
							if (object === id) return;
							q.starmapCore.setReputation.netSend({
								entityId: id,
								targetId: object,
								value: 1000,
							});
						})
					}
				>
					Friend
				</Button>
				<Button
					className="btn-xs btn-error flex-1"
					onClick={() =>
						pickStarmapShip("Choose a ship or faction to become enemies with.", (object) => {
							if (object === id) return;
							q.starmapCore.setReputation.netSend({
								entityId: id,
								targetId: object,
								value: -1000,
							});
						})
					}
				>
					Enemy
				</Button>
				<Button
					className="btn-xs btn-info flex-1"
					onClick={() =>
						pickStarmapShip(
							"Choose a ship or faction to set a reputation value with.",
							async (object) => {
								if (object === id) return;
								const stringValue = await prompt({
									header: "Set Reputation",
									body: "Enter the reputation value. 0 is neutral, positive is favorable, negative is unfavorable",
									defaultValue: "0",
								});
								if (stringValue === null) return;
								const value = Number(stringValue);
								if (Number.isNaN(value)) {
									return;
								}
								q.starmapCore.setReputation.netSend({
									entityId: id,
									targetId: object,
									value,
								});
							},
						)
					}
				>
					Pick
				</Button>
			</div>
		</div>
	);
}
