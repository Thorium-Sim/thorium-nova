export const staticStations = [
	{
		name: "Viewscreen",
		description: "Outside view of the space around the ship.",
		cards: [{ name: "Flight Director", component: "FlightDirector" }],
	},
	{
		name: "Flight Director",
		description: "Behind-the-scenes station for controlling the flight.",
		cards: [{ name: "Viewscreen", component: "Viewscreen" }],
	},
];
