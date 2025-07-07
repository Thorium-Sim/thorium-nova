import { useMenubar } from "@thorium/ui/Menubar";
import { useParams, Outlet, useNavigate } from "react-router";
import { usePrompt } from "@thorium/ui/AlertDialog";
import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import { toast } from "@thorium/context/ToastContext";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";

export default function MacrosConfig() {
	const { pluginId, macroId } = useParams() as {
		pluginId: string;
		macroId?: string;
	};
	useMenubar({
		backTo: `/config/${pluginId}/list`,
	});
	const prompt = usePrompt();
	const navigate = useNavigate();
	const [data] = q.plugin.macro.all.useNetRequest({ pluginId, type: "macro" });

	const macro = data.find((d) => d.name === macroId);

	return (
		<div className="p-8 h-[calc(100%-2rem)]">
			<h1 className="font-bold text-white text-3xl mb-4">Macro Config</h1>
			<div className="flex gap-8 h-[calc(100%-3rem)]">
				<div className="flex flex-col w-80 h-full">
					<Button
						className="btn-success btn-sm w-full"
						onClick={async () => {
							const name = await prompt({
								header: "Enter macro name",
							});
							if (typeof name !== "string") return;
							try {
								const result = await q.plugin.macro.create.netSend({
									name,
									pluginId,
									type: "macro",
								});
								navigate(`${result.macroId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error creating macro",
										body: err.message,
										color: "error",
									});
									return;
								}
							}
						}}
					>
						New Macro
					</Button>

					<SearchableList
						items={data.map((d) => ({
							id: d.name,
							name: d.name,
							description: d.description,
							category: d.category,
						}))}
						searchKeys={["name"]}
						selectedItem={macroId || null}
						setSelectedItem={({ id }) => navigate(`${id}`)}
						renderItem={(c) => (
							<div className="flex justify-between items-center" key={c.id}>
								<div>{c.name}</div>
							</div>
						)}
					/>
				</div>
				<Fragment key={macro?.name}>
					<Outlet />
				</Fragment>
			</div>
		</div>
	);
}
