import Menubar from "@thorium/ui/Menubar";
import { Outlet } from "react-router";

export default function ConfigRoutes() {
	return (
		<>
			<div className="relative z-10 h-full">
				<Menubar>
					<Outlet />
				</Menubar>
			</div>
			<div className="fixed top-0 z-0 h-full w-full bg-black/60 backdrop-blur backdrop-filter" />
		</>
	);
}
