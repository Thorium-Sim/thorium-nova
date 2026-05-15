import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import TagInput from "@thorium/ui/TagInput";
import { useState } from "react";
import { useParams, useNavigate } from "react-router";

export default function Basic() {
	const { pluginId, shipId } = useParams() as {
		pluginId: string;
		shipId: string;
	};
	const [ships] = q.plugin.ship.all.useNetRequest({ pluginId });
	const [allThemes] = q.plugin.theme.available.useNetRequest();
	const ship = ships.find((d) => d.name === shipId);
	const [error, setError] = useState(false);
	const navigate = useNavigate();
	if (!ship) return <Navigate to={`/config/${pluginId}/ships`} />;
	return (
		<fieldset key={shipId} className="max-w-3xl flex-1 overflow-y-auto">
			<div className="flex flex-wrap">
				<div className="flex-1 pr-4">
					<div className="pb-4">
						<Input
							labelHidden={false}
							isInvalid={error}
							invalidMessage="Class is required"
							label="Ship Class"
							placeholder="Galaxy"
							defaultValue={ship.name}
							onChange={() => setError(false)}
							onBlur={async (e: any) => {
								if (e.target.value === ship.name) return;
								if (!e.target.value) return setError(true);
								try {
									const result = await q.plugin.ship.update.netSend({
										pluginId,
										shipId,
										name: e.target.value,
									});
									navigate(`/config/${pluginId}/ships/${result.shipId}/basic`);
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error renaming ship",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
					</div>
					<div className="pb-4">
						<Input
							as="textarea"
							className="!h-32"
							labelHidden={false}
							label="Description"
							defaultValue={ship.description}
							onBlur={(e: any) =>
								q.plugin.ship.update.netSend({
									pluginId,
									shipId,
									description: e.target.value,
								})
							}
						/>
					</div>
					<div className="pb-4">
						<Input
							labelHidden={false}
							label="Category"
							type="textarea"
							defaultValue={ship.category}
							onBlur={(e: any) =>
								q.plugin.ship.update.netSend({
									pluginId,
									shipId,
									category: e.target.value,
								})
							}
						/>
					</div>
					<TagInput
						label="Tags"
						tags={ship.tags}
						onAdd={(tag) => {
							if (ship.tags.includes(tag)) return;
							q.plugin.ship.update.netSend({
								pluginId,
								shipId,
								tags: [...ship.tags, tag],
							});
						}}
						onRemove={(tag) => {
							if (!ship.tags.includes(tag)) return;
							q.plugin.ship.update.netSend({
								pluginId,
								shipId,
								tags: ship.tags.filter((t) => t !== tag),
							});
						}}
					/>

					<Select
						label="Theme"
						selected={ship.theme ? [ship.theme.themeId, ship.theme.pluginId].join(":::") : null}
						setSelected={(id) => {
							if (typeof id !== "string") return;
							const [themeId, themePlugin] = id.split(":::");
							q.plugin.ship.update.netSend({
								pluginId,
								shipId,
								theme: { themeId, pluginId: themePlugin },
							});
						}}
						items={
							allThemes.map((t) => ({
								id: `${t.themeId}:::${t.pluginId}`,
								label: t.themeId,
								category: t.pluginId,
							})) || []
						}
					/>
				</div>
			</div>
		</fieldset>
	);
}
