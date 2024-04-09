import { q } from "@client/context/AppContext";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";

export function ClientButton() {
	const [client] = q.client.get.useNetRequest();

	const prompt = usePrompt();
	return (
		<div className="flex items-center gap-4">
			<h2 className="text-white font-bold">Client Name:</h2>
			<Button
				className="btn-primary btn-sm m-0"
				onClick={async () => {
					const name = await prompt({
						header: "What is the new client name?",
					});
					if (typeof name === "string") {
						const result = await q.client.setName.netSend({ name });
					}
				}}
			>
				{client.name || ""}
			</Button>
		</div>
	);
}
