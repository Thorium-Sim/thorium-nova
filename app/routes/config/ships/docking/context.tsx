import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";

export const DockingPortContext = createContext<{
	isPicking: boolean;
	pickPoint: () => void;
	cancel: () => void;
	confirmPick: () => { position: Coordinate; orientation: Coordinate };
	setPickedPosition: (position: { position: Coordinate; orientation: Coordinate }) => void;
	pickedPosition: null | { position: Coordinate; orientation: Coordinate };
}>({
	isPicking: false,
	pickPoint: () => {},
	cancel: () => {},
	confirmPick: () => {
		return null as any;
	},
	setPickedPosition: () => null as any,
	pickedPosition: null,
});

export interface Coordinate {
	x: number;
	y: number;
	z: number;
}

export function DockingPortProvider({ children }: { children: ReactNode }) {
	const [isPicking, setIsPicking] = useState<boolean>(false);
	const [pickedPosition, setPickedPosition] = useState<null | {
		position: Coordinate;
		orientation: Coordinate;
	}>(null);

	const pickPoint = useCallback(() => {
		setIsPicking(true);
		setPickedPosition(null);
	}, []);
	const cancel = useCallback(() => {
		setPickedPosition(null);
		setIsPicking(false);
	}, []);
	const confirmPick = useCallback(() => {
		if (!pickedPosition) throw new Error("Position has not been picked");
		setPickedPosition(null);
		setIsPicking(false);
		return pickedPosition;
	}, [pickedPosition]);

	const value = useMemo(
		() => ({ isPicking, pickPoint, setPickedPosition, pickedPosition, cancel, confirmPick }),
		[isPicking, pickedPosition, confirmPick],
	);
	return <DockingPortContext value={value}>{children}</DockingPortContext>;
}
