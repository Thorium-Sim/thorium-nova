import { randomFromList } from "@server/utils/randomFromList";

const backgrounds = [
	"/assets/backgrounds/background.jpg",
	"/assets/backgrounds/background2.jpg",
	"/assets/backgrounds/background3.jpg",
	"/assets/backgrounds/background4.jpg",
	"/assets/backgrounds/background5.jpg",
	"/assets/backgrounds/background6.jpg",
	"/assets/backgrounds/background7.jpg",
	"/assets/backgrounds/background8.jpg",
	"/assets/backgrounds/background9.jpg",
	"/assets/backgrounds/background10.jpg",
	"/assets/backgrounds/background11.jpg",
	"/assets/backgrounds/background12.jpg",
	"/assets/backgrounds/background13.jpg",
	"/assets/backgrounds/background14.jpg",
];

export function getBackground() {
	let bg = sessionStorage.getItem("bg-otd");
	if (!bg) {
		bg = randomFromList(backgrounds);

		sessionStorage.setItem("bg-otd", bg);
	}
	return bg;
}
