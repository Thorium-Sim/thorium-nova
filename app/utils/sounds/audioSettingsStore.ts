import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAudioSettingsStore = create(
	persist<{
		mainVolume: number;
		uiVolume: number;
		soundEffectVolume: number;
		ambianceVolume: number;
		musicVolume: number;
		dialogueVolume: number;
	}>(
		() => ({
			mainVolume: 1,
			uiVolume: 1,
			soundEffectVolume: 1,
			ambianceVolume: 1,
			musicVolume: 1,
			dialogueVolume: 1,
		}),
		{
			name: "audio-store",
			version: 5,
		},
	),
);
