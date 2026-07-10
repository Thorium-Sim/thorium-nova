import { Icon } from "@thorium/ui/Icon";
import { useMenubar } from "@thorium/ui/Menubar";
import type React from "react";
import type { ReactNode } from "react";
import { href, Link, NavLink, useParams } from "react-router";

const ConfigIcon: React.FC<{
	to: string;
	disabled?: boolean;
	children: ReactNode;
}> = (props) => {
	return (
		<NavLink
			aria-disabled={props.disabled}
			className={`aspect-square rounded-lg shadow-inner transition-colors duration-300 ${
				props.disabled
					? "cursor-not-allowed bg-black/30 text-gray-500"
					: "cursor-pointer bg-white/30 hover:bg-white/50"
			} flex flex-col items-center justify-center`}
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
	useMenubar({
		backTo: `/config/${pluginId}`,
		children: (
			<Link to={href("/config/thorium")} className="btn btn-xs btn-outline btn-notice">
				<Icon name="thorium" /> Thorium Settings
			</Link>
		),
	});
	return (
		<div className="h-[calc(100%-2rem)] overflow-y-auto p-8">
			<h1 className="mb-4 text-3xl font-bold text-white">Plugin Aspects</h1>

			<div className="grid grid-cols-6 gap-16 pb-16">
				<ConfigIcon to={`/config/${pluginId}/starmap`}>
					<Icon name="star" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Universe</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/ships`}>
					<Icon name="rocket" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Ships</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/systems`}>
					<Icon name="drafting-compass" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Ship Systems</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/missions`}>
					<Icon name="map" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Missions</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/macros`}>
					<Icon name="git-branch" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Macros</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/triggers`}>
					<Icon name="circle-fading-arrow-up" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Triggers</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/reports`}>
					<Icon name="clipboard-list" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Reports</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/trainings`}>
					<Icon name="graduation-cap" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Trainings</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/themes`}>
					<Icon name="brush" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Themes</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/inventory`}>
					<Icon name="package-open" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Inventory</p>
				</ConfigIcon>
				<ConfigIcon to={`/config/${pluginId}/textPatterns`}>
					<Icon name="square-dashed-text" className="mb-4 text-6xl" />
					<p className="text-2xl font-bold">Text Patterns</p>
				</ConfigIcon>
			</div>
		</div>
	);
};

export default ConfigList;
