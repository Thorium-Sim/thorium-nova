import { useEffect, useRef } from "react";

export default function useEventListener<Event = any>(
	eventName: string,
	handler: (event: Event) => any,
	element: HTMLElement | Window = window,
) {
	// Create a ref that stores handler
	const savedHandler = useRef<any>(undefined);

	// Update ref.current value if handler changes.
	// This allows our effect below to always get latest handler ...
	// ... without us needing to pass it in effect deps array ...
	// ... and potentially cause effect to re-run every render.
	useEffect(() => {
		savedHandler.current = handler;
	}, [handler]);

	useEffect(
		() => {
			// Make sure element supports addEventListener
			// On
			const isSupported = element?.addEventListener;
			/* istanbul ignore next */
			if (!isSupported) return;

			// Create event listener that calls handler function stored in ref
			const eventListener = (event: any) => savedHandler.current?.(event);

			// Add event listener
			element.addEventListener(eventName, eventListener);

			// Remove event listener on cleanup
			return () => {
				element.removeEventListener(eventName, eventListener);
			};
		},
		[eventName, element], // Re-run if eventName or element changes
	);
}

export class RadarZoomEvent extends Event {
	static name = "radarZoomEvent";
	zoom: number;
	constructor(payload: string) {
		super(RadarZoomEvent.name);
		this.zoom = Number(payload);
	}
}
export class RadarTiltEvent extends Event {
	static name = "radarTiltEvent";
	tilt: number;
	constructor(payload: string) {
		super(RadarTiltEvent.name);
		this.tilt = Number(payload);
	}
}
export class LongRangeCommSelectEvent extends Event {
	static name = "longRangeCommSelectEvent";
	messageId: number;
	constructor(payload: string) {
		super(LongRangeCommSelectEvent.name);
		this.messageId = Number(payload);
	}
}
export class ShipMapDeckSelectEvent extends Event {
	static name = "shipMapDeckSelectEvent";
	deckIndex: number;
	constructor(payload: string) {
		super(ShipMapDeckSelectEvent.name);
		this.deckIndex = Number(payload);
	}
}
export class ShipMapRoomSelectEvent extends Event {
	static name = "shipMapRoomSelectEvent";
	roomId: number;
	constructor(payload: string) {
		super(ShipMapRoomSelectEvent.name);
		this.roomId = Number(payload);
	}
}
export class ShipMapContainerSelectEvent extends Event {
	static name = "shipMapContainerSelectEvent";
	containerId: number;
	constructor(payload: string) {
		super(ShipMapContainerSelectEvent.name);
		this.containerId = Number(payload);
	}
}
const events = [RadarZoomEvent, RadarTiltEvent, LongRangeCommSelectEvent, ShipMapDeckSelectEvent];

export function doEvent(payload: { name: string; payload: string }) {
	if (payload && "name" in payload) {
		const CustomEvent = events.find((e) => e.name === payload.name);
		if (!CustomEvent) return;
		window.dispatchEvent(new CustomEvent(payload.payload));
	}
}
