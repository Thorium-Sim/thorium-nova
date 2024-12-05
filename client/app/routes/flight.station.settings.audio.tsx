import Slider from "@thorium/ui/Slider";
import create from "zustand";
import { persist } from "zustand/middleware";

export const useAudioSettingsStore = create(
	persist<{
		mainVolume: number;
		uiVolume: number;
		soundEffectVolume: number;
		ambianceVolume: number;
		musicVolume: number;
	}>(
		(set, get) => ({
			mainVolume: 1,
			uiVolume: 1,
			soundEffectVolume: 1,
			ambianceVolume: 1,
			musicVolume: 1,
		}),
		{
			name: "audio-store",
			version: 5,
		},
	),
);

export default function AudioSettings() {
	const store = useAudioSettingsStore();
	return (
		<div>
			<Slider
				label="Main"
				minValue={0}
				maxValue={1}
				step={0.01}
				defaultValue={store.mainVolume}
				onChange={(value) =>
					!Array.isArray(value) &&
					useAudioSettingsStore.setState({ mainVolume: value })
				}
				formatOptions={{ style: "percent" }}
			/>
			<Slider
				label="UI"
				minValue={0}
				maxValue={1}
				step={0.01}
				defaultValue={store.uiVolume}
				onChange={(value) =>
					!Array.isArray(value) &&
					useAudioSettingsStore.setState({ uiVolume: value })
				}
				formatOptions={{ style: "percent" }}
			/>
			<Slider
				label="Sound Effects"
				minValue={0}
				maxValue={1}
				step={0.01}
				defaultValue={store.soundEffectVolume}
				onChange={(value) =>
					!Array.isArray(value) &&
					useAudioSettingsStore.setState({ soundEffectVolume: value })
				}
				formatOptions={{ style: "percent" }}
			/>
			<Slider
				label="Ambiance"
				minValue={0}
				maxValue={1}
				step={0.01}
				defaultValue={store.ambianceVolume}
				onChange={(value) =>
					!Array.isArray(value) &&
					useAudioSettingsStore.setState({ ambianceVolume: value })
				}
				formatOptions={{ style: "percent" }}
			/>
			<Slider
				label="Music"
				minValue={0}
				maxValue={1}
				step={0.01}
				defaultValue={store.musicVolume}
				onChange={(value) =>
					!Array.isArray(value) &&
					useAudioSettingsStore.setState({ musicVolume: value })
				}
				formatOptions={{ style: "percent" }}
			/>
		</div>
	);
}
