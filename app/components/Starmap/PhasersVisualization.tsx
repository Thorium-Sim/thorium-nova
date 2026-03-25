import { q } from "@thorium/context/AppContext";
import { ConeVisualization } from "@thorium/cards/Targeting/Phasers";

export function PhasersVisualization({ shipId }: { shipId: number }) {
	const [phasers] = q.targeting.phasers.list.useNetRequest({ shipId });
	return (
		<>
			{phasers.map((phaser) => (
				<ConeVisualization key={phaser.id} {...phaser} />
			))}
		</>
	);
}
