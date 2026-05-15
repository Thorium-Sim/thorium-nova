import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import { Fragment } from "react";
import { Outlet, useNavigate, useParams } from "react-router";

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
		<div className="h-[calc(100%-2rem)] p-8">
			<h1 className="mb-4 text-3xl font-bold text-white">Themes Config</h1>
			<div className="flex h-[calc(100%-3rem)] gap-8">
				<div className="flex h-full w-80 flex-col">
					<Button
						className="btn-sm btn-success w-full"
						onClick={async () => {
							const name = await prompt({ header: "Enter theme name" });
							if (typeof name !== "string" || name.trim().length === 0) return;
							try {
								const result = await q.plugin.theme.create.netSend({
									name,
									pluginId,
								});
								void navigate(`${result.themeId}`);
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
							<div className="flex items-center justify-between" key={c.id}>
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
