import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import Input from "@thorium/ui/Input";
import { Fragment, useContext, useReducer, useRef } from "react";
import { useParams } from "react-router";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { Navigate } from "@thorium/components/Navigate";
import Checkbox from "@thorium/ui/Checkbox";
import { produce } from "immer";
import Button from "@thorium/ui/Button";

export default function LongRangeCommConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.longRangeComm.get.useNetRequest({
		pluginId,
		systemId,
		shipId,
		shipPluginId,
	});
	const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());
	const key = `${systemId}${rekey}`;

	const fileRef = useRef<HTMLInputElement>(null);

	if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

	function updateCypher(
		font: string,
		key: "code" | "name" | "active",
		value: any,
	) {
		q.plugin.systems.longRangeComm.update.netSend({
			pluginId,
			systemId,
			shipId,
			shipPluginId,
			cyphers: produce(system.cyphers, (draft) => {
				const c = draft.find((d) => d.font === font);
				if (c) {
					// @ts-expect-error
					c[key] = value;
				}
			}),
		});
	}
	return (
		<fieldset key={key} className="flex-1 overflow-y-auto">
			<link
				rel="stylesheet"
				href={`/plugins/${pluginId}/${systemId}/cypher.css`}
			/>
			<div className="flex flex-wrap">
				<div className="flex-1 pr-4">
					<p>Cyphers</p>
					<div className="p-2 bg-black/20 rounded space-y-2">
						{system.cyphers.map((cypher) => (
							<Fragment key={cypher.font}>
								<div className="flex items-center gap-2">
									<Input
										label="Code"
										defaultValue={cypher.code}
										onBlur={(event) =>
											updateCypher(
												cypher.font,
												"code",
												event.currentTarget.value,
											)
										}
									/>
									<Input
										label="Name"
										defaultValue={cypher.name}
										onBlur={(event) =>
											updateCypher(
												cypher.font,
												"name",
												event.currentTarget.value,
											)
										}
									/>
									<Checkbox
										label="Active"
										defaultChecked={cypher.active}
										onBlur={(event) =>
											updateCypher(
												cypher.font,
												"active",
												event.currentTarget.checked,
											)
										}
									/>
								</div>
								<p style={{ fontFamily: cypher.name }}>
									The quick fox jumped over the lazy dog.
								</p>
							</Fragment>
						))}
					</div>
				</div>
			</div>
			<input
				type="file"
				ref={fileRef}
				multiple={false}
				className="w-0 h-0 opacity-0"
				value=""
				onChange={(e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					q.plugin.systems.longRangeComm.addCode.netSend({
						pluginId,
						systemId,
						shipId,
						shipPluginId,
						file,
					});
				}}
			/>
			<Button
				className="btn-success w-full sticky bottom-0"
				onClick={() => fileRef.current?.click()}
			>
				Add Cypher
			</Button>
		</fieldset>
	);
}
