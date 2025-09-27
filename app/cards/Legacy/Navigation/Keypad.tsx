import { cn } from "@thorium/utils/cn";
import React, { useEffect } from "react";
// import useSoundEffect from "helpers/hooks/useSoundEffect";

const Keypad = ({
	keydown,
	clear,
	enter,
	className,
}: {
	keydown: (val: string) => void;
	clear: () => void;
	enter: () => void;
	className?: string;
}) => {
	// const playEffect = useSoundEffect();
	useEffect(() => {
		const handleKeydown = (e: KeyboardEvent) => {
			// playEffect("buttonClick");

			if (
				e.target instanceof HTMLElement &&
				e.target.classList.contains("no-keypad")
			)
				return;
			if (e.key === "Backspace" || e.key === "Delete") {
				//Delete key
				clear();
			}
			if (e.key === "Enter" || e.key === "Return") {
				//Enter key
				enter();
			}
			if (!Number.isNaN(Number(e.key)) || e.key === ".") {
				keydown(e.key);
			}
		};

		document.addEventListener("keydown", handleKeydown, false);
		return () => document.removeEventListener("keydown", handleKeydown, false);
	}, [clear, enter, keydown]);

	const handleClick = (which: string) => {
		// playEffect("buttonClick");
		if (which === "clear") return clear();
		if (which === "enter") return enter();
		return keydown(which);
	};
	return (
		<div
			className={cn(
				`keypadButtons grid grid-cols-3 items-center w-fit h-fit gap-2 place-self-center`,
				className,
			)}
		>
			<div
				onClick={() => handleClick("7")}
				className="keypad btn btn-lg aspect-square"
			>
				7
			</div>
			<div
				onClick={() => handleClick("8")}
				className="keypad btn btn-lg aspect-square"
			>
				8
			</div>
			<div
				onClick={() => handleClick("9")}
				className="keypad btn btn-lg aspect-square"
			>
				9
			</div>
			<div
				onClick={() => handleClick("4")}
				className="keypad btn btn-lg aspect-square"
			>
				4
			</div>
			<div
				onClick={() => handleClick("5")}
				className="keypad btn btn-lg aspect-square"
			>
				5
			</div>
			<div
				onClick={() => handleClick("6")}
				className="keypad btn btn-lg aspect-square"
			>
				6
			</div>
			<div
				onClick={() => handleClick("1")}
				className="keypad btn btn-lg aspect-square"
			>
				1
			</div>
			<div
				onClick={() => handleClick("2")}
				className="keypad btn btn-lg aspect-square"
			>
				2
			</div>
			<div
				onClick={() => handleClick("3")}
				className="keypad btn btn-lg aspect-square"
			>
				3
			</div>
			<div
				onClick={() => handleClick(".")}
				className="keypad btn btn-lg aspect-square"
			>
				.
			</div>
			<div
				onClick={() => handleClick("0")}
				className="keypad btn btn-lg aspect-square"
			>
				0
			</div>
			<div
				onClick={() => handleClick("clear")}
				className="keypad btn btn-warning clearButton btn-lg aspect-square"
			>
				C
			</div>
			<div
				onClick={() => handleClick("enter")}
				className="col-span-3 btn btn-primary enter btn-lg"
			>
				Enter
			</div>
		</div>
	);
};

export default Keypad;
