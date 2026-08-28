import { produce } from "immer";
import { load, dump } from "js-yaml";

const file = Bun.file("./data/plugins/Thorium Default/ships/Astra Seeker/manifest.yml");
const ship = load(await file.text());

const newShip = produce(ship, (draft) => {
	for (const deck of draft.decks) {
		for (const node of deck.nodes) {
			// node.x = node.x * (30 / 350);
			// node.y = node.y * (30 / 350);
			node.radius = node.radius * (30 / 350);
		}
	}
});

await file.write(
	dump(newShip, {
		skipInvalid: true,
	}),
);
