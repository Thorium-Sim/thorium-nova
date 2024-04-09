import Menubar from "@thorium/ui/Menubar";
import { Outlet } from "@remix-run/react";

export default function ConfigRoutes() {
	return (
		<>
			<div className="z-10 relative h-full">
				<Menubar>
					<Outlet />
				</Menubar>
			</div>
			<div className="w-full h-full bg-black/60 fixed backdrop-filter backdrop-blur top-0 z-0" />
		</>
	);
}
