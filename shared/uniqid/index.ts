export default function uniqid(prefix = "", suffix = "") {
	return (
		(prefix ? prefix : "") +
		time().toString(36) +
		Math.trunc(Math.random() * 2 ** 8)
			.toString(36)
			.padStart(2, "0") +
		(suffix ? suffix : "")
	);
}

let lastValue = 0;
function time() {
	const time = Date.now();
	const last = lastValue || time;
	lastValue = time > last ? time : last + 1;
	return lastValue;
}
