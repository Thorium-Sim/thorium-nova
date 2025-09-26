import { randomFromList } from "@thorium/utils/operations/randomFromList";

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
	"/assets/backgrounds/background12.avif",
];

export function getBackground() {
	let bg = sessionStorage.getItem("bg-otd");
	if (!bg) {
		bg = randomFromList(backgrounds);

		sessionStorage.setItem("bg-otd", bg);
	}
	return bg;
}
