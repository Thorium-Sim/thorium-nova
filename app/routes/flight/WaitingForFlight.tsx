import { Icon } from "@thorium/ui/Icon";

export function WaitingForFlight() {
	return (
		<>
			<h1 className="text-center text-6xl font-bold text-white">Waiting for Flight to Start...</h1>
			<Icon name="loader" className="animate-spin-step mx-auto mt-4 text-4xl text-white" />
		</>
	);
}
