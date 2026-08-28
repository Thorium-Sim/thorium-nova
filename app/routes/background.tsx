import { createRNG } from "@thorium/utils/rng";
import { Outlet } from "react-router";

const backgrounds = [
	"/assets/backgrounds/background.avif",
	"/assets/backgrounds/background2.avif",
	"/assets/backgrounds/background3.avif",
	"/assets/backgrounds/background4.avif",
	"/assets/backgrounds/background5.avif",
	"/assets/backgrounds/background6.avif",
	"/assets/backgrounds/background7.avif",
	"/assets/backgrounds/background8.avif",
	"/assets/backgrounds/background9.avif",
	"/assets/backgrounds/background10.avif",
	"/assets/backgrounds/background11.avif",
	"/assets/backgrounds/background12.avif",
	"/assets/backgrounds/background13.avif",
	"/assets/backgrounds/background14.avif",
	"/assets/backgrounds/background15.avif",
	"/assets/backgrounds/background16.avif",
	"/assets/backgrounds/background17.avif",
	"/assets/backgrounds/background18.avif",
	"/assets/backgrounds/background19.avif",
	"/assets/backgrounds/background20.avif",
	"/assets/backgrounds/background21.avif",
];

const rng = createRNG(new Date().toDateString());
const bg = rng.nextFromList(backgrounds);

export default function Background() {
	return (
		<>
			<div
				className="fixed inset-0 -z-10 bg-cover bg-center"
				style={{
					backgroundImage: `linear-gradient(
135deg,
rgba(0, 0, 0, 1) 0%,
rgba(0, 0, 0, 0) 40%,
rgba(0, 0, 0, 0) 60%,
rgba(0, 0, 0, 1) 100%
),
url(${bg})`,
				}}
			/>
			<Outlet />
		</>
	);
}
