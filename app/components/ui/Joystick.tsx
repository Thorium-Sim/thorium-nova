import type { GamepadKey } from "@thorium/hooks/useGamepadStore";
import { animated as a } from "@react-spring/web";
import { useJoystick } from "@thorium/hooks/useJoystick";
import type { ReactNode } from "react";
import { cn } from "@thorium/utils/cn";

export const Joystick = ({
	children,
	className,
	onDrag,
	gamepadKeys,
}: {
	onDrag: (dir: { x: number; y: number }) => void;
	className?: string;
	children?: ReactNode;
	gamepadKeys?: { x: GamepadKey; y: GamepadKey };
}) => {
	const [xy, bind, containerRef, set] = useJoystick({
		axisSnap: true,
		onDrag,
		gamepadKeys,
	});

	const eventHandlers = bind();
	return (
		<div className={cn(`relative aspect-square`, className)}>
			<div
				ref={containerRef}
				className="top-0 absolute bg-black/50 border-2 border-white/50 rounded-full w-full h-full flex justify-center items-center touch-none"
				{...eventHandlers}
				onPointerDown={(e) => {
					// Find the offset from the center
					const rect = containerRef.current?.getBoundingClientRect();
					if (!rect) return;
					const center = [
						rect.left + rect.width / 2,
						rect.top + rect.height / 2,
					] as const;
					set([e.clientX - center[0], e.clientY - center[1]]);
					eventHandlers.onPointerDown?.(e);
				}}
			>
				<a.div
					{...eventHandlers}
					style={{
						transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`),
					}}
					// @ts-expect-error
					className="z-10 w-10 h-10 rounded-full border-black/50 border-2 bg-gray-500 shadow-md cursor-pointer touch-none"
				/>
				{children}
			</div>
		</div>
	);
};

export const LinearJoystick = ({
	className,
	onDrag,
	children,
	vertical,
	gamepadKey,
}: {
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
			{...eventHandlers}
			onPointerDown={(e) => {
				// Find the offset from the center
				const rect = containerRef.current?.getBoundingClientRect();
				if (!rect) return;
				const center = [
					rect.left + rect.width / 2,
					rect.top + rect.height / 2,
				] as const;
				set([
					vertical ? 0 : e.clientX - center[0],
					vertical ? e.clientY - center[1] : 0,
				]);
				eventHandlers.onPointerDown?.(e);
			}}
		>
			<a.div
				{...eventHandlers}
				style={{ transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`) }}
				// @ts-expect-error
				className="z-10 w-10 h-10 rounded-full border-black/50 border-2 bg-gray-500 shadow-md cursor-pointer touch-none"
			/>
			{children}
		</div>
	);
};
