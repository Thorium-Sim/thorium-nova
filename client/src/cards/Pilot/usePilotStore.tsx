import create from "zustand";

export const usePilotStore = create<{
  zoom: number;
  tilt: number;
  width: number;
  height: number;
}>(set => ({
  zoom: 100,
  tilt: 0,
  width: 0,
  height: 0,
}));
