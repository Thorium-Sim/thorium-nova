import { q } from "@thorium/context/AppContext";
import { usePlayAmbiance } from "./usePlayAmbiance";

export function useAmbiance() {
	useReactorAmbiance();
	useImpulseEnginesAmbiance();
}

function useImpulseEnginesAmbiance() {
	const [impulseEngines, { dataUpdatedAt }] =
		q.pilot.impulseEngines.ambiance.useNetRequest(undefined, {
			refetchInterval: 2000,
		});
	usePlayAmbiance("impulseEngines", impulseEngines, dataUpdatedAt);
}

function useReactorAmbiance() {
	const [reactors, { dataUpdatedAt }] =
		q.systemsMonitor.reactors.ambiance.useNetRequest(undefined, {
			refetchInterval: 2000,
		});
	usePlayAmbiance("reactors", reactors, dataUpdatedAt);
}
