import { useImpulseEnginesAmbiance } from "@client/utils/sounds/Ambiance/useImpulseEngineAmbiance";
import { useReactorAmbiance } from "@client/utils/sounds/Ambiance/useReactorAmbiance";

export function useAmbiance() {
	useReactorAmbiance();
	useImpulseEnginesAmbiance();
}
