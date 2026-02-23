import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Portal } from "@thorium/ui/Portal";
import { cn } from "@thorium/utils/cn";

export type WarningEntry = {
	id: string;
	priority: number;
	content: ReactNode;
	/** Auto-dismiss after this many milliseconds. Omit for persistent warnings. */
	duration?: number;
};

export function useShipWarnings() {
	const warningsRef = useRef(new Map<string, WarningEntry>());
	const [displayedWarning, setDisplayedWarning] =
		useState<WarningEntry | null>(null);
	const [fadingOut, setFadingOut] = useState(false);
	const pendingWarningRef = useRef<WarningEntry | null>(null);
	const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const durationTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

	// Mirror state into refs so stable callbacks can read latest values
	const displayedWarningRef = useRef(displayedWarning);
	displayedWarningRef.current = displayedWarning;
	const fadingOutRef = useRef(fadingOut);
	fadingOutRef.current = fadingOut;
	const dismissWarningRef = useRef<(id: string) => void>(() => {});

	const getHighestPriority = useCallback((): WarningEntry | null => {
		let highest: WarningEntry | null = null;
		for (const entry of warningsRef.current.values()) {
			if (!highest || entry.priority > highest.priority) {
				highest = entry;
			}
		}
		return highest;
	}, []);

	const startFadeOut = useCallback(
		(next: WarningEntry | null) => {
			pendingWarningRef.current = next;
			setFadingOut(true);
			clearTimeout(fadeTimeoutRef.current);
			fadeTimeoutRef.current = setTimeout(() => {
				setFadingOut(false);
				if (pendingWarningRef.current) {
					setDisplayedWarning({ ...pendingWarningRef.current });
				} else {
					setDisplayedWarning(null);
				}
				pendingWarningRef.current = null;
			}, 500);
		},
		[],
	);

	// Stable callback — reads from refs, never goes stale
	const showWarning = useCallback(
		(entry: WarningEntry) => {
			const existing = warningsRef.current.get(entry.id);
			warningsRef.current.set(entry.id, entry);

			// Start or reset duration timer (runs independently of display)
			if (entry.duration) {
				const existingTimer = durationTimersRef.current.get(entry.id);
				if (existingTimer) clearTimeout(existingTimer);
				const timerId = setTimeout(() => {
					durationTimersRef.current.delete(entry.id);
					dismissWarningRef.current(entry.id);
				}, entry.duration);
				durationTimersRef.current.set(entry.id, timerId);
			}

			// If we're mid-crossfade, update pending if this is higher priority
			if (fadingOutRef.current) {
				const pending = pendingWarningRef.current;
				if (!pending || entry.priority >= pending.priority) {
					pendingWarningRef.current = entry;
				}
				return;
			}

			// Same warning updated in place — just update content
			if (existing && displayedWarningRef.current?.id === entry.id) {
				setDisplayedWarning({ ...entry });
				return;
			}

			// No warning currently displayed — fade in
			if (!displayedWarningRef.current) {
				setDisplayedWarning({ ...entry });
				return;
			}

			// Higher or equal priority than current — crossfade
			if (entry.priority >= displayedWarningRef.current.priority) {
				if (entry.id !== displayedWarningRef.current.id) {
					startFadeOut(entry);
				}
				return;
			}
			// Lower priority — just store, don't display
		},
		[startFadeOut],
	);

	// Stable callback — reads from refs, never goes stale
	const dismissWarning = useCallback(
		(id: string) => {
			warningsRef.current.delete(id);

			// Clean up the duration timer for this warning
			const timer = durationTimersRef.current.get(id);
			if (timer) {
				clearTimeout(timer);
				durationTimersRef.current.delete(id);
			}

			// If we're mid-crossfade and this is the pending warning, update pending
			if (fadingOutRef.current) {
				if (pendingWarningRef.current?.id === id) {
					pendingWarningRef.current = getHighestPriority();
				}
				return;
			}

			if (displayedWarningRef.current?.id === id) {
				const next = getHighestPriority();
				if (next) {
					startFadeOut(next);
				} else {
					startFadeOut(null);
				}
			}
		},
		[getHighestPriority, startFadeOut],
	);
	dismissWarningRef.current = dismissWarning;

	useEffect(() => {
		return () => {
			clearTimeout(fadeTimeoutRef.current);
			for (const timer of durationTimersRef.current.values()) {
				clearTimeout(timer);
			}
		};
	}, []);

	return { showWarning, dismissWarning, displayedWarning, fadingOut };
}

export function ShipWarning({
	warning,
	fadingOut,
	mode = "portal",
	className,
}: {
	warning: WarningEntry | null;
	fadingOut: boolean;
	mode?: "portal" | "inline";
	className?: string;
}) {
	if (!warning) return null;

	const inner = (
		<div
			className={cn(
				"text-red-500 text-3xl tracking-wide select-none pointer-events-none whitespace-nowrap text-center tabular-nums",
				fadingOut ? "animate-ship-warning-out" : "animate-ship-warning",
				mode === "portal" &&
					"fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
				mode === "inline" && className,
			)}
			style={{ fontFamily: '"Battlefield"' }}
		>
			{warning.content}
		</div>
	);

	if (mode === "portal") {
		return <Portal>{inner}</Portal>;
	}

	return inner;
}
