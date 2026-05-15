import lottie from "lottie-web";
import { useEffect, useRef } from "react";
export function Astronaut() {
	const container = useRef<HTMLDivElement>(null);

	useEffect(() => {
		async function loadAnimation() {
			if (container.current) {
				const animationData = (await import("./astronaut.json")).default;
				const config = {
					container: container.current,
					autoplay: true,
					loop: true,
					animationData,
				};
				lottie.loadAnimation(config);
			}
		}

		loadAnimation();
	}, []);

	return <div ref={container} className="mx-auto h-[500px] w-[500px] overflow-hidden" />;
}
