import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { href, useNavigate } from "react-router";

import type { Route } from "./+types/layout";

export default function KeyboardsConfig({ params: { pluginId } }: Route.ComponentProps) {
	useMenubar({
		backTo: href(`/config/:pluginId/list`, { pluginId }),
	});
	const prompt = usePrompt();
	const navigate = useNavigate();
	const [data] = q.plugin.keyboard.all.useNetRequest({ pluginId });

	return (
		<div className="h-[calc(100%-2rem)] p-8">
			<div className="flex h-[calc(100%-3rem)] gap-8">
				<div className="flex h-full w-80 flex-col">
					<h1 className="mb-4 text-3xl font-bold text-white">Keyboard Config</h1>
					<Button
						className="btn-success btn-sm w-full"
						onClick={async () => {
							const name = await prompt({
								header: "Enter keyboard name",
							});
							if (typeof name !== "string") return;
							try {
								const result = await q.plugin.keyboard.create.netSend({
									name,
									pluginId,
								});
								navigate(`${result.keyboardId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error creating keyboard",
										body: err.message,
										color: "error",
									});
									return;
								}
							}
						}}
					>
						New Keyboard
					</Button>

					<SearchableList
						items={data.map((d) => ({
							id: d.name,
							name: d.name,
							description: d.description,
							category: d.category,
						}))}
						searchKeys={["name"]}
						setSelectedItem={({ id }) => navigate(`${id}`)}
						renderItem={(c) => (
							<div className="flex items-center justify-between" key={c.id}>
								<div>{c.name}</div>
							</div>
						)}
					/>
				</div>
			</div>
		</div>
	);
}
