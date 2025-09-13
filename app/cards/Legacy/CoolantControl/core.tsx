import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import { InputField } from "@thorium/ui/Core";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { useRef } from "react";

export function LegacyHeatCore() {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();
	const { interpolate } = useLiveQuery();

	const [systems] = q.legacy.coolantControl.systems.useNetRequest({ shipId });
	const [coolantTank] = q.legacy.coolantControl.tank.useNetRequest({ shipId });
	q.legacy.coolantControl.stream.useDataStream({ shipId });

	const coolantRef = useRef<HTMLDivElement>(null);
	useAnimationFrame(() => {
		const entity = interpolate(coolantTank.id);
		if (!entity) return;
		if (coolantRef.current) {
			coolantRef.current.innerText = `${Math.round(entity.c * 100)}`;
		}
	}, cardLoaded);
	return (
		<table className="w-full text-xs">
			<thead>
				<tr className="border-b border-white-/40">
					<th>System</th>
					<th>Heat</th>
					<th>Heat Rate</th>
					<th>Coolant</th>
				</tr>
			</thead>
			<tbody>
				{systems.map((sys) => (
					<SystemRow key={sys.id} {...sys} />
				))}
				<tr>
					<td colSpan={3}>{coolantTank.name}</td>
					<td>
						<InputField
							className="tabular-nums"
							ref={coolantRef}
							prompt="What is the new coolant level?"
							onClick={(coolant) => {
								if (Number.isNaN(Number(coolant))) return;
								q.legacy.coolantControl.setCoolant.netSend({
									systemId: coolantTank.id,
									coolant: Number(coolant),
								});
							}}
						/>
					</td>
				</tr>
			</tbody>
		</table>
	);
}

function SystemRow({
	id,
	name,
	heatRate,
	nominalHeat,
	maxHeat,
}: {
	id: number;
	name: string;
	heatRate: number;
	nominalHeat: number;
	maxHeat: number;
}) {
	const heatRef = useRef<HTMLDivElement>(null);
	const coolantRef = useRef<HTMLDivElement>(null);
	const { cardLoaded } = useCardContext();
	const { interpolate } = useLiveQuery();

	useAnimationFrame(() => {
		const entity = interpolate(id);
		if (!entity) return;
		if (heatRef.current) {
			heatRef.current.innerText = `${Math.round(((entity.z - nominalHeat) / (maxHeat - nominalHeat)) * 100)}`;
		}
		if (coolantRef.current) {
			coolantRef.current.innerText = `${Math.round(entity.c * 100)}`;
		}
	}, cardLoaded);
	return (
		<tr className="border-b border-white/20">
			<td>{name}</td>
			<td>
				<InputField
					className="tabular-nums"
					ref={heatRef}
					prompt="What is the new heat level?"
					onClick={(heat) => {
						if (Number.isNaN(Number(heat))) return;
						q.legacy.coolantControl.setHeat.netSend({
							systemId: id,
							heat: Number(heat) / 100,
						});
					}}
				/>
			</td>
			<td>
				<InputField
					className="tabular-nums"
					prompt="What is the new heat rate?"
					promptValue={heatRate}
					onClick={(heatRate) => {
						if (Number.isNaN(Number(heatRate))) return;
						q.legacy.coolantControl.setHeatRate.netSend({
							systemId: id,
							heatRate: Number(heatRate),
						});
					}}
				>
					{heatRate}
				</InputField>
			</td>
			<td>
				<InputField
					className="tabular-num"
					ref={coolantRef}
					prompt="What is the new coolant level?"
					onClick={(coolant) => {
						if (Number.isNaN(Number(coolant))) return;
						q.legacy.coolantControl.setCoolant.netSend({
							systemId: id,
							coolant: Number(coolant),
						});
					}}
				/>
			</td>
		</tr>
	);
}
