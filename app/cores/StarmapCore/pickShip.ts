import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import useEventListener from "@thorium/hooks/useEventListener";

export function pickStarmapShip(label: string, callback: PickShipCallback) {
	window.dispatchEvent(new PickShipEvent(label, callback));
}

type PickShipCallback = (object: number) => void;
export class PickShipEvent extends Event {
	static name = "pick-ship-event";
	constructor(
		public label: string,
		public callback: PickShipCallback,
	) {
		super(PickShipEvent.name);
	}
}
export class PickShipDoneEvent extends Event {
	static name = "pick-ship-done-event";
	constructor(public object: number | null) {
		super(PickShipDoneEvent.name);
	}
}

export function usePickStarmapShip() {
	const useStarmapStore = useGetStarmapStore();

	useEventListener<PickShipEvent>(PickShipEvent.name, (event) => {
		useStarmapStore.setState({
			clickAction: {
				label: event.label,
				action: (object) => {
					window.dispatchEvent(new PickShipDoneEvent(object));
					useStarmapStore.setState({ clickAction: undefined });
					if (!object) {
						return;
					}
					event.callback(object);
				},
			},
		});
	});
}
