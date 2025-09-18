import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSensorsStore = create(
	persist<{
		askForSpeed: boolean;
		nudgeDistance: number;
		showContactLabels: boolean;
		selectedContact: number | null;
		planet: {
			name: string;
			color: string;
			size: number;
			icon: "";
			picture: string;
		};
		border: { name: string; color: string; size: 1; icon: ""; picture: string };
		ping: {
			name: string;
			color: string;
			size: number;
			icon: "";
			picture: string;
		};
	}>(
		() => ({
			askForSpeed: false,
			nudgeDistance: 5,
			showContactLabels: false,
			selectedContact: null,
			planet: {
				name: "Planet",
				color: "#663399",
				size: 0.75,
				icon: "",
				picture: "",
			},
			border: {
				name: "Border",
				color: "#663399",
				size: 1,
				icon: "",
				picture: "",
			},
			ping: { name: "", color: "#663399", size: 5, icon: "", picture: "" },
		}),
		{
			name: "legacy-sensors-store",
			version: 1,
		},
	),
);

export const sensorsSpeeds = [
	{ id: 1000, label: "Instant" },
	{ id: 1, label: "Warp" },
	{ id: 0.3, label: "Very Fast" },
	{ id: 0.1, label: "Fast" },
	{ id: 0.05, label: "Moderate" },
	{ id: 0.025, label: "Slow" },
	{ id: 0.01, label: "Very Slow" },
];
