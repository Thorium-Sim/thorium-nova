import { create } from "zustand";

export const useShipMapStore = create<{
	selectedRoomId: number | null;
	selectedContainerId: number | null;
	deckIndex: number;
	transform: { x: number; y: number; widthScale: number };
}>(() => ({
	selectedRoomId: null,
	selectedContainerId: null,
	deckIndex: 0,
	transform: { x: 1, y: 1, widthScale: 1 },
}));
