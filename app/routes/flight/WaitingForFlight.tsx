import { Icon } from "@thorium/ui/Icon";

export function WaitingForFlight() {
	return (
		<>
			<h1 className="text-6xl text-white font-bold text-center">
				Waiting for Flight to Start...
			</h1>
			<Icon
				name="loader"
				className="animate-spin-step text-4xl text-white mx-auto mt-4"
			/>
		</>
	);
}
