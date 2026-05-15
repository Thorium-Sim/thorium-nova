import { animated as a } from "@react-spring/web";
import type { GamepadKey } from "@thorium/hooks/useGamepadStore";
import { useJoystick } from "@thorium/hooks/useJoystick";
import { cn } from "@thorium/utils/cn";
import type { ReactNode } from "react";

export const Joystick = ({
	children,
	className,
	onDrag,
	gamepadKeys,
	id,
	sticky,
	ref,
}: {
	id: string;
	onDrag: (dir: { x: number; y: number }, down: boolean) => void;
	className?: string;
	children?: ReactNode;
	gamepadKeys?: { x: GamepadKey; y: GamepadKey };
	sticky?: boolean;
	ref?: React.RefObject<{
		reset: () => void;
		set: (x: number, y: number) => void;
	} | null>;
}) => {
	const [xy, bind, containerRef, set] = useJoystick({
		axisSnap: true,
		onDrag,
		gamepadKeys,
		sticky,
		ref,
	});

	const eventHandlers = bind();
	return (
		<div className={cn(`relative aspect-square`, className)}>
			<div
				ref={containerRef}
				className="absolute top-0 flex h-full w-full touch-none items-center justify-center rounded-full border-2 border-white/50 bg-black/50"
				draggable={false}
				{...eventHandlers}
				onPointerDown={(e) => {
					// Find the offset from the center
					const rect = containerRef.current?.getBoundingClientRect();
					if (!rect) return;
					const center = [rect.left + rect.width / 2, rect.top + rect.height / 2] as const;
					set([e.clientX - center[0], e.clientY - center[1]]);
					eventHandlers.onPointerDown?.(e);
				}}
			>
				<a.div
					data-testid={id}
					{...eventHandlers}
					style={{
						transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`),
					}}
					className="z-10 aspect-square w-1/12 cursor-pointer touch-none rounded-full border-2 border-black/50 bg-gray-500 shadow-md"
				/>
				{children}
			</div>
		</div>
	);
};

export const LinearJoystick = ({
	id,
	className,
	onDrag,
	children,
	vertical,
	gamepadKey,
}: {
	id: string;
	className?: string;
	onDrag: (dirs: { x: number; y: number }) => void;
	children: ReactNode;
	vertical?: boolean;
	gamepadKey?: GamepadKey;
}) => {
	const [xy, bind, containerRef, set] = useJoystick({
		axis: vertical ? "y" : "x",
		onDrag,
		gamepadKeys: gamepadKey
			? vertical
				? { x: "" as GamepadKey, y: gamepadKey }
				: { x: gamepadKey, y: "" as GamepadKey }
			: undefined,
	});
	const eventHandlers = bind();
	return (
		<div
			ref={containerRef}
			className={cn(
				vertical ? "h-full" : "w-full",
				"relative bg-black/50 border-2 border-white/50 rounded-full flex justify-center items-center touch-none",
				className,
			)}
			draggable={false}
			{...eventHandlers}
			onPointerDown={(e) => {
				// Find the offset from the center
				const rect = containerRef.current?.getBoundingClientRect();
				if (!rect) return;
				const center = [rect.left + rect.width / 2, rect.top + rect.height / 2] as const;
				set([vertical ? 0 : e.clientX - center[0], vertical ? e.clientY - center[1] : 0]);
				eventHandlers.onPointerDown?.(e);
			}}
		>
			<a.div
				data-testid={id}
				{...eventHandlers}
				style={{ transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`) }}
				className="z-10 h-10 w-10 cursor-pointer touch-none rounded-full border-2 border-black/50 bg-gray-500 shadow-md"
			/>
			{children}
		</div>
	);
};
