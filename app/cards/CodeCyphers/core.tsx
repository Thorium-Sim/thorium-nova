import Printable from "@thorium/components/printable";
import { q } from "@thorium/context/AppContext";
import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import { useStation } from "@thorium/routes/station/useStation";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { InputField, TypingField } from "@thorium/ui/Core";
import Select from "@thorium/ui/Select";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import { Fragment } from "react";
import { flushSync } from "react-dom";

import { CodeList } from "./CodeList";

export function CodeCyphersCore() {
	const { shipId } = useStation();
	const [{ page }, setPage] = useLocalStorage<{ page: "codes" | "compose" }>(
		"codeCypher-selectedPage",
		{ page: "codes" },
	);
	const [cyphers] = q.codeCyphers.availableCyphers.useNetRequest({
		shipId,
		isCore: true,
	});
	const prompt = usePrompt();

	const [{ selectedCypher }, setSelectedCypher] = useLocalStorage<{
		selectedCypher: string | null;
	}>("codeCypher-selectedCypher", { selectedCypher: null });
	const [{ heading }, setHeading] = useLocalStorage("codeCypher-heading", {
		heading: "==== Intercepted Message ====",
	});
	const [{ message }, setMessage] = useLocalStorage("codeCypher-message", {
		message: "",
	});
	return (
		<div className="flex h-full flex-col text-sm">
			<div className="sticky top-0">
				<Button
					className={cn("btn-xs", { "btn-active": page === "codes" })}
					onClick={() => setPage({ page: "codes" })}
				>
					Codes
				</Button>
				<Button
					className={cn("btn-xs", { "btn-active": page === "compose" })}
					onClick={() => setPage({ page: "compose" })}
				>
					Compose
				</Button>
			</div>
			{page === "codes" ? (
				<div className="grid grid-cols-4">
					{cyphers.map((c) => (
						<Fragment key={c.font}>
							<span>{c.name}</span>
							<Tooltip
								content={
									<span style={{ fontFamily: c.name }}>the quick fox jumps over the lazy dog.</span>
								}
							>
								<span>{c.code}</span>
							</Tooltip>
							<Checkbox
								label="Active"
								checked={c.active}
								onChange={(event) =>
									q.codeCyphers.setCypherAvailable.netSend({
										shipId,
										cypherFont: c.font,
										active: event.currentTarget.checked,
									})
								}
							/>
							<Button
								className="btn-xs"
								onClick={() => {
									flushSync(() => {
										setSelectedCypher({ selectedCypher: c.name });
									});
									window.print();
								}}
							>
								Print
							</Button>
						</Fragment>
					))}
					<Printable>
						<div className="cypher-printing code-list col-span-2 grid grid-cols-4">
							<h1 className="col-span-4 text-center text-lg font-medium">=== Code Cypher ===</h1>
							<CodeList font={selectedCypher || ""} />
						</div>
					</Printable>
				</div>
			) : (
				<>
					<InputField
						prompt="What heading would you like your coded message to have?"
						promptValue={heading}
						onClick={(value) => setHeading({ heading: value })}
					>
						{heading}
					</InputField>
					<TypingField
						className="w-full flex-1 text-left"
						value={message}
						onChange={(event) => setMessage({ message: event.currentTarget.value })}
					/>
					<div className="flex">
						<Select
							size="xs"
							className="flex-1"
							label="Code Cypher"
							labelHidden
							selected={selectedCypher}
							setSelected={(value) => setSelectedCypher({ selectedCypher: value })}
							items={cyphers.map((c) => ({
								id: c.name,
								label: `${c.code} - ${c.name} ${c.active ? "✅" : "🚫"}`,
							}))}
						/>
						<Button
							className="btn-warning btn-xs"
							onClick={async () => {
								const name = await prompt("What is the name of the document?");
								if (!name) return;
								await q.documents.renderPdf.netSend({
									shipId,
									name,
									heading,
									message,
									fontName: selectedCypher,
								});
							}}
						>
							Add Document
						</Button>
						<Button
							className="btn-success btn-xs"
							onClick={() => {
								window.print();
							}}
						>
							Print
						</Button>
						<Printable>
							<div>
								<h1 className="text-center text-lg font-medium">{heading}</h1>
								<div
									className="mt-8 !text-left text-2xl whitespace-pre-wrap print:leading-[3]"
									style={{ fontFamily: selectedCypher || "" }}
								>
									{message}
								</div>
							</div>
						</Printable>
					</div>
				</>
			)}
		</div>
	);
}
