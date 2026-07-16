import type { ElementProps } from "@thorium/cards/EngineeringPanels/elements/ElementProps";

import "./keypad.css";
import { useRef, useState } from "react";

export function Keypad({ update }: ElementProps) {
	const [output, setOutput] = useState("");
	const outputRef = useRef<HTMLDivElement>(null);
	return (
		<div className="row-span-3 flex flex-col items-center gap-2">
			<div className="keypad">
				<kbd data-key="7" onClick={() => setOutput((o) => `${o}7`.slice(0, 10))}></kbd>
				<kbd data-key="8" onClick={() => setOutput((o) => `${o}8`.slice(0, 10))}></kbd>
				<kbd data-key="9" onClick={() => setOutput((o) => `${o}9`.slice(0, 10))}></kbd>
				<kbd data-key="4" onClick={() => setOutput((o) => `${o}4`.slice(0, 10))}></kbd>
				<kbd data-key="5" onClick={() => setOutput((o) => `${o}5`.slice(0, 10))}></kbd>
				<kbd data-key="6" onClick={() => setOutput((o) => `${o}6`.slice(0, 10))}></kbd>
				<kbd data-key="1" onClick={() => setOutput((o) => `${o}1`.slice(0, 10))}></kbd>
				<kbd data-key="2" onClick={() => setOutput((o) => `${o}2`.slice(0, 10))}></kbd>
				<kbd data-key="3" onClick={() => setOutput((o) => `${o}3`.slice(0, 10))}></kbd>
				<kbd data-key="C" onClick={() => setOutput("")}></kbd>
				<kbd data-key="0" onClick={() => setOutput((o) => `${o}0`.slice(0, 10))}></kbd>
				<kbd
					data-key="→"
					onClick={async () => {
						const result = await update(Number(output));
						if (result) {
							outputRef.current?.classList.add("text-green-500");
						} else {
							outputRef.current?.classList.add("text-red-500");
						}
						setTimeout(() => {
							outputRef.current?.classList.remove("text-green-500");
							outputRef.current?.classList.remove("text-red-500");
						}, 3000);
					}}
				></kbd>
			</div>
			<div ref={outputRef} className="keypad-output tabular-nums">
				{output || <>&nbsp;</>}
			</div>
		</div>
	);
}
