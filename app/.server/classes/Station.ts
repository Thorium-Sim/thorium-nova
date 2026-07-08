import type { Card, Widget } from "./Card";

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

	messageGroups: string[];

	constructor(params: Partial<Station>) {
		this.name = params.name || "Station";
		this.description = params.description || "";
		this.tags = params.tags || [];
		this.logo = params.logo || "";
		this.theme = params.theme || "Default";
		this.cards = params.cards || [];
		this.widgets = params.widgets || [];
		this.messageGroups = params.messageGroups || [];
	}
}
