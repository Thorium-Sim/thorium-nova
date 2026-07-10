import { keepPreviousData } from "@tanstack/react-query";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import { useMenubar } from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import TagInput from "@thorium/ui/TagInput";
import UploadWell from "@thorium/ui/UploadWell";
import { Suspense, useState } from "react";
import { href, Link, NavLink, useNavigate, useParams } from "react-router";

export default function PluginEdit() {
	const { pluginId } = useParams() as { pluginId: string };
	const [plugins] = q.plugin.all.useNetRequest();
	const navigate = useNavigate();
	const prompt = usePrompt();
	useMenubar({
		children: (
			<Link to={href("/config/thorium")} className="btn btn-xs btn-outline btn-notice">
				<Icon name="thorium" /> Thorium Settings
			</Link>
		),
	});
	return (
		<div className="h-[calc(100%-2rem)] p-8">
			<h1 className="mb-4 text-3xl font-bold text-white">Plugin Config</h1>

			<div className="flex h-[calc(100%-3rem)] gap-8">
				<div className="flex h-full w-80 flex-col">
					<Button
						className="btn-sm btn-success w-full"
						onClick={async () => {
							const name = await prompt({ header: "Enter plugin name" });
							if (typeof name !== "string") return;
							try {
								const result = await q.plugin.create.netSend({ name });
								void navigate(`/config/${result.pluginId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error creating plugin",
										body: err.message,
										color: "error",
									});
								}
							}
						}}
					>
						New Plugin
					</Button>

					<SearchableList
						items={plugins.map((d) => ({
							id: d.id,
							name: d.name,
							description: d.description,
							tags: d.tags,
							author: d.author,
							active: d.active,
						}))}
						searchKeys={["name", "author", "tags"]}
						selectedItem={pluginId || null}
						setSelectedItem={({ id }) => navigate(`/config/${id}`)}
						renderItem={(c) => (
							<div className="flex items-center justify-between" key={c.id}>
								<div>
									{c.name}
									{c.active ? "" : <span className="text-red-600"> (inactive)</span>}
									<div>
										<small>{c.author}</small>
									</div>
								</div>
								<NavLink {...{ to: `/config/${c.id}/list` }} onClick={(e) => e.stopPropagation()}>
									<Icon name="pencil" />
								</NavLink>
							</div>
						)}
					/>
				</div>
				<Suspense fallback={<PluginDetails />}>
					<PluginDetails />
				</Suspense>
			</div>
		</div>
	);
}

function PluginDetails() {
	const [error, setError] = useState(false);
	const confirm = useConfirm();
	const prompt = usePrompt();
	const navigate = useNavigate();
	const { pluginId } = useParams() as { pluginId: string };

	const [plugin] = q.plugin.get.useNetRequest(
		{ pluginId },
		{ enabled: !!pluginId, placeholderData: keepPreviousData },
	);

	return (
		<>
			<div className="w-96 space-y-4" key={plugin?.id}>
				<Input
					label="Plugin Name"
					defaultValue={plugin?.name}
					isInvalid={error}
					invalidMessage="Name is required"
					disabled={!plugin}
					onChange={() => setError(false)}
					onBlur={async (e: React.FocusEvent<Element>) => {
						const target = e.target as HTMLInputElement;
						if (!plugin) return;
						if (target.value) {
							try {
								const result = await q.plugin.update.netSend({
									name: target.value,
									pluginId: plugin.id,
								});
								void navigate(`/config/${result.pluginId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error renaming plugin",
										body: err.message,
										color: "error",
									});
								}
							}
						} else {
							setError(true);
						}
					}}
				/>
				<Input
					label="Description"
					as="textarea"
					className="h-64"
					defaultValue={plugin?.description}
					onChange={() => setError(false)}
					disabled={!plugin}
					onBlur={(e: React.FocusEvent<Element>) => {
						const target = e.target as HTMLInputElement;
						void (
							plugin &&
							q.plugin.update.netSend({
								description: target.value,
								pluginId: plugin.id,
							})
						);
					}}
				/>
				<TagInput
					label="Tags"
					tags={plugin?.tags || []}
					disabled={!plugin}
					onAdd={(tag) => {
						if (plugin?.tags.includes(tag) || !plugin) return;
						void q.plugin.update.netSend({
							tags: [...plugin.tags, tag],
							pluginId: plugin.id,
						});
					}}
					onRemove={(tag) => {
						if (!plugin) return;
						void q.plugin.update.netSend({
							tags: plugin.tags.filter((t) => t !== tag),
							pluginId: plugin.id,
						});
					}}
				/>
				<div className="grid w-full grid-cols-2 gap-2">
					{plugin?.active ? (
						<Button
							className="btn-outline btn-warning w-full"
							disabled={!pluginId}
							onClick={async () => {
								if (!pluginId) return;
								void q.plugin.update.netSend({ pluginId, active: false });
							}}
						>
							Deactivate Plugin
						</Button>
					) : (
						<Button
							className="btn-outline btn-success w-full"
							disabled={!pluginId}
							onClick={async () => {
								if (!pluginId) return;
								void q.plugin.update.netSend({ pluginId, active: true });
							}}
						>
							Activate Plugin
						</Button>
					)}
					<Button
						className="btn-outline btn-error w-full"
						disabled={!pluginId}
						onClick={async () => {
							if (
								!pluginId ||
								!(await confirm({
									header: "Are you sure you want to delete this plugin?",
									body: "All content in this plugin, including images and other assets, will be gone forever.",
								}))
							)
								return;
							void q.plugin.update.netSend({ pluginId });
							void navigate("/config");
						}}
					>
						Delete Plugin
					</Button>
					<Button
						className="btn-outline btn-notice w-full"
						disabled={!pluginId}
						onClick={async () => {
							if (!pluginId) return;
							const name = await prompt({
								header: "What is the name of the duplicated plugin?",
							});
							if (!name || typeof name !== "string") return;
							try {
								const result = await q.plugin.update.netSend({
									pluginId: pluginId,
									name,
								});
								void navigate(`/config/${result.pluginId}`);
							} catch (err) {
								if (err instanceof Error) {
									toast({
										title: "Error duplicating plugin",
										body: err.message,
										color: "error",
									});
									return;
								}
							}
						}}
					>
						Duplicate Plugin
					</Button>
					<Link
						className={`btn btn-outline btn-warning w-full ${!pluginId ? "btn-disabled" : ""}`}
						to={`/config/${pluginId}/list`}
					>
						Edit Plugin
					</Link>
					{plugin?.default ? (
						<Button
							className="btn-outline btn-info w-full"
							disabled={!pluginId}
							onClick={async () => {
								if (!pluginId) return;
								if (
									await confirm({
										header: "Are you sure you want to restore the default plugin?",
										body: "Any changes that you've made to the default plugin will be overwritten.",
									})
								) {
									await q.server.restoreDefaultPlugin.netSend();
								}
							}}
						>
							Restore Plugin
						</Button>
					) : null}
				</div>
			</div>
			<div>
				<label htmlFor="cover-image">
					<span className="flex">
						Cover Image{" "}
						<InfoTip>
							Used on the Thorium Plugin Registry. Images should be square and at least 1024x1024 in
							size.
						</InfoTip>
					</span>
					<UploadWell
						id="cover-image"
						className="aspect-square h-auto max-w-sm"
						accept="image/*"
						disabled={!plugin}
						onChange={(files: FileList) => {
							if (!plugin) return;
							void q.plugin.update.netSend({
								pluginId: plugin.id,
								coverImage: files[0],
							});
						}}
					>
						{plugin?.coverImage && (
							<img
								src={`${plugin.coverImage}?${Date.now()}`}
								className="h-[90%] w-[90%] object-cover"
								alt="Cover"
							/>
						)}
					</UploadWell>
				</label>
			</div>
		</>
	);
}
