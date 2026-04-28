import { useRef, useState } from "react";

export function useRandomCharacterState(defaultMessage: string = "") {
	const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
	const [encodedMessage, setEncodedMessage] = useState(defaultMessage);

	function setMessage(previousMessage: string, nextMessage: string, immediate?: boolean) {
		for (const timeout of timeouts.current) {
			clearTimeout(timeout);
		}
		timeouts.current = [];

		if (immediate || !nextMessage) {
			setEncodedMessage(nextMessage);
			return;
		}

		const randomOrder = Array.from({
			length: nextMessage.length,
		})
			.map((_, i) => i)
			.sort(() => Math.random() - 0.5);
		randomOrder.forEach((index, i) => {
			let message = previousMessage;
			for (let j = 0; j < i; j++) {
				const index = randomOrder[j];
				message =
					message.slice(0, Math.max(index - 1, 0)) + nextMessage[index] + message.slice(index);
			}
			timeouts.current.push(
				setTimeout(() => {
					setEncodedMessage(message);
				}, 5 * i),
			);
		});
		timeouts.current.push(
			setTimeout(
				() => {
					setEncodedMessage(nextMessage);
				},
				5 * (randomOrder.length + 1),
			),
		);
	}

	return [encodedMessage, setMessage] as const;
}
