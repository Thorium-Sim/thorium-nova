import { useEffect, useState } from "react";

export function useTransferAmount() {
	const [transferAmount, setTransferAmount] = useState(1);

	useEffect(() => {
		function handleKey(event: KeyboardEvent) {
			let transferAmount = 1;
			if (event.metaKey) {
				if (event.altKey) {
					transferAmount = 20;
				} else {
					transferAmount = 10;
				}
			} else {
				if (event.altKey) {
					transferAmount = 5;
				}
			}
			setTransferAmount(transferAmount);
		}
		window.addEventListener("keydown", handleKey);
		window.addEventListener("keyup", handleKey);
		return () => {
			window.removeEventListener("keydown", handleKey);
			window.removeEventListener("keyup", handleKey);
		};
	}, []);

	return transferAmount;
}
