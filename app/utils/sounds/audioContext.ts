export const audioContext =
	typeof window === "undefined" ? null! : new AudioContext();
let resumed = false;
if (typeof document !== "undefined") {
	document.body.onmousemove = () => {
		if (!resumed) {
			audioContext.resume();
			resumed = true;
		}
	};
}
