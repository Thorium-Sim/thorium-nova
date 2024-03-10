import { q } from "@client/context/AppContext";
import { toast } from "@client/context/ToastContext";
import { Outlet, useNavigate, useParams } from "@remix-run/react";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";

export default function ThemesLayout() {
	const { pluginId, themeId } = useParams() as {
		pluginId: string;
		themeId?: string;
	};
	useMenubar({
		backTo: `/config/${pluginId}/list`,
	});

	const navigate = useNavigate();
	const prompt = usePrompt();
	const [data] = q.plugin.theme.all.useNetRequest({ pluginId });
	const theme = data.find((d) => d.name === themeId);

	return (
		<div className="p-8 h-[calc(100%-2rem)]">
			<h1 className="font-bold text-white text-3xl mb-4">Themes Config</h1>
			<div className="flex gap-8 h-[calc(100%-3rem)]">
				<div className="flex flex-col w-80 h-full">
					<Button
						className="w-full btn-sm btn-success"
						onClick={async () => {
							const name = await prompt({ header: "Enter theme name" });
							if (typeof name !== "string" || name.trim().length === 0) return;
							try {
								const result = await q.plugin.theme.create.netSend({
									name,
									pluginId,
								});
								navigate(`${result.themeId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error creating theme",
										body: err.message,
										color: "error",
									});
									return;
								}
							}
						}}
					>
						New theme
					</Button>

					<SearchableList
						items={data.map((d) => ({
							id: d.name,
							name: d.name,
						}))}
						searchKeys={["name"]}
						selectedItem={themeId || null}
						setSelectedItem={({ id }) => navigate(`${id}`)}
						renderItem={(c) => (
							<div className="flex justify-between items-center" key={c.id}>
								<div>{c.name}</div>
							</div>
						)}
					/>
				</div>
				<Fragment key={theme?.name}>
					<Outlet />
				</Fragment>
			</div>
		</div>
	);
}
