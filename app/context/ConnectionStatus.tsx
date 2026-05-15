import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { useEffect, useState } from "react";

export const Reconnecting = () => {
	const [timeoutPassed, setTimeoutPassed] = useState(false);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setTimeoutPassed(true);
		}, 500);
		return () => {
			clearTimeout(timeout);
		};
	}, []);

	if (!timeoutPassed) return null;

	return (
		<div className="fixed inset-0 z-30 flex flex-col items-center justify-center space-y-8 bg-black/70">
			<h2 className="text-error text-6xl font-bold">Reconnecting to Server...</h2>
			<Icon name="loader" className="animate-spin-step text-6xl text-white" />
			<Button
				className="btn btn-primary btn-lg"
				onClick={() => {
					window.location.reload();
				}}
			>
				Reconnect Now
			</Button>
		</div>
	);
};
export const Disconnected = () => {
	return (
		<div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black/70">
			<h2 className="text-error text-6xl font-bold drop-shadow-md filter">
				Disconnected from Server
			</h2>
			<Button
				className="btn btn-primary btn-lg mt-16"
				onClick={() => {
					window.location.reload();
				}}
			>
				Reconnect
			</Button>
		</div>
	);
};
