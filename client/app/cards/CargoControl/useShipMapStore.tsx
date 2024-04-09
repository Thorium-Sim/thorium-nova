import create from "zustand";

export const useShipMapStore = create<{
	selectedRoomId: number | null;
	selectedContainerId: number | null;
	deckIndex: number;
}>((set) => ({
	selectedRoomId: null,
	selectedContainerId: null,
	deckIndex: 0,
}));
