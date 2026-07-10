import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";
import { useNavigate, Outlet } from "react-router";

import type { Route } from "./+types/layout";

export default function TextPatternList({
	params: { pluginId, textPatternId },
}: Route.ComponentProps) {
	useMenubar({ backTo: `/config/${pluginId}/list` });

	const navigate = useNavigate();
	const prompt = usePrompt();
	const [data] = q.plugin.textPattern.all.useNetRequest({ pluginId });
	const textPattern = data.find((d) => d.name === textPatternId);

	return (
		<div className="h-[calc(100%-2rem)] p-8">
			<h1 className="mb-4 text-3xl font-bold text-white">Text Pattern Config</h1>
			<div className="flex h-[calc(100%-3rem)] gap-8">
				<div className="flex h-full w-80 flex-col">
					<Button
						className="btn-success btn-sm w-full"
						onClick={async () => {
							const name = await prompt({
								header: "Enter text pattern name",
							});
							if (typeof name !== "string") return;
							try {
								const result = await q.plugin.textPattern.create.netSend({
									name,
									pluginId,
								});
								void navigate(`${result.textPatternId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error creating text pattern",
										body: err.message,
										color: "error",
									});
									return;
								}
							}
						}}
					>
						New Text Pattern
					</Button>

					<SearchableList
						items={data.map((d) => ({
							id: d.name,
							name: d.name,
							description: d.description,
							category: d.category,
						}))}
						searchKeys={["name"]}
						selectedItem={textPatternId || null}
						setSelectedItem={({ id }) => navigate(`${id}`)}
						renderItem={(c) => (
							<div className="flex items-center justify-between" key={c.id}>
								<div>{c.name}</div>
							</div>
						)}
					/>
				</div>
				<Fragment key={textPattern?.name}>
					<Outlet />
				</Fragment>
			</div>
		</div>
	);
}
