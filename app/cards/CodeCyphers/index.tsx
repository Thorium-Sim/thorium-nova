import { CodeList } from "@thorium/cards/CodeCyphers/CodeList";
import Printable from "@thorium/components/printable";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { cn } from "@thorium/utils/cn";
import { useState } from "react";

export function CodeCyphers() {
	const { shipId } = useStation();
	const [cyphers] = q.codeCyphers.availableCyphers.useNetRequest({ shipId });
	const [selectedCypherName, setSelectedCypher] = useState<string | null>(null);
	const selectedCypher = cyphers.find((c) => c.name === selectedCypherName);
	return (
		<div className="grid flex-1 grid-cols-3 gap-4 overflow-hidden">
			<div className="flex min-h-0 flex-1 flex-col">
				<p>Cyphers</p>
				<ul className="panel panel-alert list-group flex-1 overflow-y-auto">
					{cyphers.map((c) => (
						<li
							key={c.font}
							className={cn("list-group-item whitespace-nowrap", {
								selected: c.name === selectedCypherName,
							})}
							onClick={() => setSelectedCypher(c.name)}
						>
							{c.code}
						</li>
					))}
				</ul>
				<Button className="btn-secondary btn-sm w-full" onClick={() => window.print()}>
					Print
				</Button>
			</div>
			<Printable preview>
				<div className="cypher-printing code-list col-span-2 grid grid-cols-4">
					<h1 className="col-span-4 text-center text-lg font-medium">=== Code Cypher ===</h1>
					{selectedCypher && <CodeList font={selectedCypher?.name} />}
				</div>
			</Printable>
		</div>
	);
}
