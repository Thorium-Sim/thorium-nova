import { ConeVisualization } from "@thorium/cards/Targeting/Phasers";
import { q } from "@thorium/context/AppContext";

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
