import { useParams } from "@remix-run/react";
import { lazy } from "react";
import { q } from "@client/context/AppContext";

export const systemConfigs = Object.fromEntries(
	Object.entries(import.meta.glob("./SystemConfigs/*.tsx")).map(
		([path, mod]) => {
			const pathRegx = /\.\/SystemConfigs\/(.*)\.tsx/g;
			const [, name] = pathRegx.exec(path)!;

			return [name, lazy(mod as any)];
		},
	),
);

export default function SystemConfig() {
	const { pluginId, systemId } = useParams() as {
		pluginId: string;
		systemId: string;
	};
	const [system] = q.plugin.systems.get.useNetRequest({ pluginId, systemId });
	const Comp = systemConfigs[system.type];
	if (!Comp)
		return (
			<h3 className="text-center text-xl">
				No configuration for this system type.
			</h3>
		);
	return <Comp />;
}
