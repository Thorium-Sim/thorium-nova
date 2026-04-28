import { Portal } from "@thorium/ui/Portal";
import { cn } from "@thorium/utils/cn";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type WarningEntry = {
	id: string;
	priority: number;
	content: ReactNode;
	/** Auto-dismiss after this many milliseconds. Omit for persistent warnings. */
	duration?: number;
};

/**
 * Manages a priority queue of ship warnings with enter/exit lifecycle hooks.
 *
 * The `isEntering` and `isExiting` states drive CSS class hooks
 * (`ship-alert-entering`, `ship-alert-exiting`) that themes can target with
 * CSS animations (e.g. fade-in, slide-in). Without a theme defining animations
 * for these classes, warnings appear and disappear instantly — a double-rAF
 * fallback in ShipWarning completes the transition immediately when no CSS
 * animation is detected.
 */
export function useShipWarnings() {
	const warningsRef = useRef(new Map<string, WarningEntry>());
	const [displayedWarning, setDisplayedWarning] = useState<WarningEntry | null>(null);
	const [isEntering, setIsEntering] = useState(false);
	const [isExiting, setIsExiting] = useState(false);
	const durationTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

	// Mirror state into refs so stable callbacks can read latest values
	const displayedWarningRef = useRef(displayedWarning);
	displayedWarningRef.current = displayedWarning;
	const isExitingRef = useRef(isExiting);
	isExitingRef.current = isExiting;
	const dismissWarningRef = useRef<(id: string) => void>(() => {});
	const pendingNextRef = useRef<WarningEntry | null>(null);

	const getHighestPriority = useCallback((): WarningEntry | null => {
		let highest: WarningEntry | null = null;
		for (const entry of warningsRef.current.values()) {
			if (!highest || entry.priority > highest.priority) {
				highest = entry;
			}
		}
		return highest;
	}, []);

	const onEntryComplete = useCallback(() => {
		setIsEntering(false);
	}, []);

	const onExitComplete = useCallback(() => {
		setIsExiting(false);
		const next = pendingNextRef.current;
		pendingNextRef.current = null;
		if (next) {
			setDisplayedWarning(next);
			setIsEntering(true);
		} else {
			setDisplayedWarning(null);
		}
	}, []);

	// Stable callback — reads from refs, never goes stale
	const showWarning = useCallback((entry: WarningEntry) => {
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

		// If we're mid-exit, update pending if this is higher priority
		if (isExitingRef.current) {
			const pending = pendingNextRef.current;
			if (!pending || entry.priority >= pending.priority) {
				pendingNextRef.current = entry;
			}
			return;
		}

		// Same warning updated in place — just update content
		if (existing && displayedWarningRef.current?.id === entry.id) {
			setDisplayedWarning({ ...entry });
			return;
		}

		// No warning currently displayed — show immediately
		if (!displayedWarningRef.current) {
			setDisplayedWarning({ ...entry });
			setIsEntering(true);
			return;
		}

		// Higher or equal priority than current — exit current, then show new
		if (entry.priority >= displayedWarningRef.current.priority) {
			if (entry.id !== displayedWarningRef.current.id) {
				pendingNextRef.current = entry;
				setIsExiting(true);
			}
			return;
		}
		// Lower priority — just store, don't display
	}, []);

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

			// If we're mid-exit and this is the pending warning, update pending
			if (isExitingRef.current) {
				if (pendingNextRef.current?.id === id) {
					pendingNextRef.current = getHighestPriority();
				}
				return;
			}

			if (displayedWarningRef.current?.id === id) {
				pendingNextRef.current = getHighestPriority();
				setIsExiting(true);
			}
		},
		[getHighestPriority],
	);
	dismissWarningRef.current = dismissWarning;

	useEffect(() => {
		return () => {
			for (const timer of durationTimersRef.current.values()) {
				clearTimeout(timer);
			}
		};
	}, []);

	return {
		showWarning,
		dismissWarning,
		displayedWarning,
		isEntering,
		isExiting,
		onEntryComplete,
		onExitComplete,
	};
}

export function ShipWarning({
	warning,
	isEntering,
	isExiting,
	onEntryComplete,
	onExitComplete,
	mode = "portal",
	className,
}: {
	warning: WarningEntry | null;
	isEntering: boolean;
	isExiting: boolean;
	onEntryComplete?: () => void;
	onExitComplete?: () => void;
	mode?: "portal" | "inline";
	className?: string;
}) {
	const divRef = useRef<HTMLDivElement>(null);

	// Fallback: if no theme CSS animation is defined for ship-alert-entering
	// or ship-alert-exiting, complete the transition immediately so warnings
	// don't get stuck waiting for an animationend event that will never fire.
	useEffect(() => {
		if (!isEntering && !isExiting) return;

		let cancelled = false;
		requestAnimationFrame(() => {
			if (cancelled) return;
			requestAnimationFrame(() => {
				if (cancelled) return;
				const el = divRef.current;
				if (!el || el.getAnimations().length > 0) return;
				if (isEntering) onEntryComplete?.();
				if (isExiting) onExitComplete?.();
			});
		});

		return () => {
			cancelled = true;
		};
	}, [isEntering, isExiting, onEntryComplete, onExitComplete]);

	if (!warning) return null;

	const inner = (
		<div
			ref={divRef}
			key={warning.id}
			className={cn(
				"ship-alert-message",
				"text-red-500 text-3xl tracking-wide select-none pointer-events-none whitespace-nowrap text-center tabular-nums",
				// Theme hooks: themes can define CSS animations for these classes.
				// Without theme animations, the rAF fallback above handles transitions.
				isEntering && "ship-alert-entering",
				isExiting && "ship-alert-exiting",
				mode === "portal" && "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
				mode === "inline" && className,
			)}
			// When a theme CSS animation finishes, this bridges back to the
			// enter/exit state machine so the next warning can be shown.
			onAnimationEnd={() => {
				if (isEntering) onEntryComplete?.();
				else if (isExiting) onExitComplete?.();
			}}
		>
			{warning.content}
		</div>
	);

	if (mode === "portal") {
		return (
			<Portal>
				<div className="theme-container">{inner}</div>
			</Portal>
		);
	}

	return inner;
}
