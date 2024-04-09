import type React from "react";
import type { ReactNode } from "react";

import { NavLink, useParams } from "@remix-run/react";
import { useMenubar } from "@thorium/ui/Menubar";
import { Icon } from "@thorium/ui/Icon";

const ConfigIcon: React.FC<{
	to: string;
	disabled?: boolean;
	children: ReactNode;
}> = (props) => {
	return (
		<NavLink
			aria-disabled={props.disabled}
			className={`h-64 w-64 shadow-inner rounded-lg transition-colors duration-300 ${
				props.disabled
					? "text-gray-500 bg-black/30 cursor-not-allowed"
					: "bg-white/30 cursor-pointer hover:bg-white/50"
			}  flex justify-center items-center flex-col`}
			onClick={(e) => {
				if (props.disabled) {
					e.preventDefault();
				}
			}}
			{...props}
		/>
	);
};

const ConfigList = () => {
	const { pluginId } = useParams();
	useMenubar({ backTo: `/config/${pluginId}` });
	return (
		<div className="p-8 h-[calc(100%-2rem)] overflow-y-auto">
			<h1 className="font-bold text-white text-3xl mb-4">Plugin Aspects</h1>

			<div className="h-full grid grid-cols-4 gap-16">
				<ConfigIcon to={`/config/${pluginId}/starmap`}>
					<Icon name="star" className="text-6xl mb-4" />
					<p className="font-bold text-2xl">Universe</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/ships`}>
					<Icon name="rocket" className="text-6xl mb-4" />
					<p className="font-bold text-2xl">Ships</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/systems`}>
					<Icon name="drafting-compass" className="text-6xl mb-4" />
					<p className="font-bold text-2xl">Ship Systems</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/timelines`}>
					<Icon name="git-branch" className="text-6xl mb-4" />
					<p className="font-bold text-2xl">Timelines</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/themes`}>
					<Icon name="brush" className="text-6xl mb-4" />
					<p className="font-bold text-2xl">Themes</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/inventory`}>
					<Icon name="package-open" className="text-6xl mb-4" />
					<p className="font-bold text-2xl">Inventory</p>
				</ConfigIcon>
			</div>
		</div>
	);
};

export default ConfigList;
