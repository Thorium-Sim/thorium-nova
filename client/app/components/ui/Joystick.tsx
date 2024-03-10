import type { GamepadKey } from "@client/hooks/useGamepadStore";
import { animated as a } from "@react-spring/web";
import { useJoystick } from "@client/hooks/useJoystick";
import type { ReactNode } from "react";
import { cn } from "@client/utils/cn";

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
	const [xy, bind, containerRef] = useJoystick({
		axisSnap: true,
		onDrag,
		gamepadKeys,
	});

	return (
		<div className={cn(`relative aspect-square`, className)}>
			<div
				ref={containerRef}
				className="top-0 absolute bg-black/50 border-2 border-white/50 rounded-full w-full h-full flex justify-center items-center"
			>
				<a.div
					{...bind()}
					style={{
						transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`),
					}}
					className="z-10 w-10 h-10 rounded-full border-black/50 border-2 bg-gray-500 shadow-md cursor-pointer"
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
	const [xy, bind, containerRef] = useJoystick({
		axis: vertical ? "y" : "x",
		onDrag,
		gamepadKeys: gamepadKey
			? vertical
				? { x: "" as GamepadKey, y: gamepadKey }
				: { x: gamepadKey, y: "" as GamepadKey }
			: undefined,
	});
	return (
		<div
			ref={containerRef}
			className={`${
				vertical ? "h-full" : "w-full"
			} relative bg-black/50 border-2 border-white/50 rounded-full flex justify-center items-center ${className}`}
		>
			<a.div
				{...bind()}
				style={{ transform: xy?.to((x, y) => `translate3d(${x}px,${y}px,0)`) }}
				className="z-10 w-10 h-10 rounded-full border-black/50 border-2 bg-gray-500 shadow-md cursor-pointer"
			/>
			{children}
		</div>
	);
};
