import { Card, Widget } from "./Card";

export const staticStations = [
	{
		name: "Flight Director",
		cards: [{ name: "Flight Director", component: "FlightDirector" }],
	},
	{
		name: "Viewscreen",
		cards: [{ name: "Viewscreen", component: "Viewscreen" }],
	},
];
export default class Station {
	apiVersion = "stations/v1" as const;
	kind = "stations" as const;

	name: string;

	description: string;

	logo: string;

	theme: string;

	tags: string[];

	cards: Card[];

	widgets: Widget[];

	constructor(params: Partial<Station>) {
		this.name = params.name || "Station";
		this.description = params.description || "";
		this.tags = params.tags || [];
		this.logo = params.logo || "";
		this.theme = params.theme || "Default";
		this.cards = [];
		this.widgets = [];
		params.cards?.forEach((c) => this.cards.push(new Card(c)));
		params.widgets?.forEach((w) => this.widgets.push(new Widget(w)));
	}
}
