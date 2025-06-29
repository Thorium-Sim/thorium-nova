import { cn } from "@thorium/utils/cn";
import {
	Link,
	matchPath,
	Outlet,
	useLocation,
	useNavigate,
} from "react-router";
import Modal from "@thorium/ui/Modal";
import type { ReactNode } from "react";

export default function SettingsOptions() {
	const navigate = useNavigate();

	return (
		<Modal isOpen={true} setIsOpen={() => navigate("..")} title="Settings">
			<div className="mt-4 flex gap-4" style={{ minWidth: "480px" }}>
				<div>
					<SettingListItem path="audio">Audio</SettingListItem>
					<SettingListItem path="gamepad">Gamepad</SettingListItem>
				</div>
				<div className="flex-1">
					<Outlet />
				</div>
			</div>
		</Modal>
	);
}

function SettingListItem({
	children,
	path,
}: { children: ReactNode; path: string }) {
	const setting = matchPath(
		"/flight/station/settings/:setting",
		useLocation().pathname,
	)?.params.setting;

	return (
		<Link
			to={path}
			className={cn("list-group-item list-group-item-small", {
				selected: setting === path,
			})}
		>
			{children}
		</Link>
	);
}
