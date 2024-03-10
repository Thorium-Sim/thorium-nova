import { useParams, useNavigate } from "@remix-run/react";
import { useContext, useReducer, useState } from "react";
import Input from "@thorium/ui/Input";
import TagInput from "@thorium/ui/TagInput";
import { toast } from "@client/context/ToastContext";
import { ShipPluginIdContext } from "@client/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "./OverrideResetButton";
import { q } from "@client/context/AppContext";
import { Navigate } from "@client/components/Navigate";

export default function Basic() {
	const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.get.useNetRequest({
		pluginId,
		systemId,
		shipId,
		shipPluginId,
	});
	const [error, setError] = useState(false);
	const navigate = useNavigate();
	const key = `${systemId}${rekey}`;
	if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;
	return (
		<fieldset key={key} className="flex-1 overflow-y-auto">
			<div className="flex flex-wrap">
				<div className="flex-1 pr-4">
					<div className="pb-4 flex items-end">
						<Input
							labelHidden={false}
							isInvalid={error}
							invalidMessage="Name is required"
							label="Name"
							placeholder="Duotronic Interface"
							defaultValue={system.name}
							onChange={() => setError(false)}
							onBlur={async (e: any) => {
								if (!e.target.value) return setError(true);
								try {
									const result = await q.plugin.systems.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										name: e.target.value,
									});
									if (!shipId) {
										navigate(
											`/config/${pluginId}/systems/${result.shipSystemId}`,
										);
									}
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error renaming system",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton property="name" setRekey={setRekey} />
					</div>
					<div className="pb-4 flex">
						<Input
							as="textarea"
							className="!h-32"
							labelHidden={false}
							label="Description"
							defaultValue={system.description}
							onBlur={(e: any) =>
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									description: e.target.value,
								})
							}
						/>
						<OverrideResetButton
							property="description"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-4 flex items-end">
						<div className="flex-1">
							<TagInput
								label="Tags"
								tags={system.tags}
								onAdd={(tag) => {
									if (system.tags.includes(tag)) return;
									q.plugin.systems.update.netSend({
										pluginId,
										systemId: systemId,
										tags: [...system.tags, tag],
									});
								}}
								onRemove={(tag) => {
									if (!system.tags.includes(tag)) return;
									q.plugin.systems.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										tags: system.tags.filter((t) => t !== tag),
									});
								}}
							/>
						</div>
						<OverrideResetButton property="tags" setRekey={setRekey} />
					</div>
				</div>
			</div>
		</fieldset>
	);
}
