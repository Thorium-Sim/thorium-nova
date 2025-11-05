import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Select from "@thorium/ui/Select";

export function LegacyEngineControlCore() {
	const { shipId } = useStation();
	const [{ warpEngines, impulseEngines }] =
		q.legacy.engineControl.get.useNetRequest({ shipId });

	return (
		<div>
			<Select
				label="Engine Speed"
				size="sm"
				items={[
					{ id: "stop", label: "Full Stop" },
					...(impulseEngines
						? [
								{
									header: impulseEngines?.name,
									items: impulseEngines.speeds.map(({ label }, i) => ({
										id: `impulse-${i}`,
										label,
									})),
								},
							]
						: []),
					...(warpEngines
						? [
								{
									header: warpEngines?.name,
									items: warpEngines.speeds.map(({ label }, i) => ({
										id: `warp-${i + 1}`,
										label,
									})),
								},
							]
						: []),
				]}
				selected={
					warpEngines?.currentWarpFactor && warpEngines.currentWarpFactor > 0
						? `warp-${warpEngines.currentWarpFactor}`
						: impulseEngines?.currentSpeed && impulseEngines.currentSpeed > 0
							? `impulse-${Math.trunc((impulseEngines.currentSpeed / impulseEngines.cruisingSpeed) * (impulseEngines.speeds.length - 1)) - 1}`
							: "stop"
				}
				setSelected={(key) => {
					if (!key) return;
					const [engine, index] = key.split("-");

					q.legacy.engineControl.setSpeed.netSend({
						shipId,
						warpSpeedIndex: engine === "warp" ? Number(index) : undefined,
						impulseSpeedIndex: engine === "impulse" ? Number(index) : undefined,
					});
				}}
			/>
		</div>
	);
}
