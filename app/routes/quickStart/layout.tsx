import { FlightQuickStartProvider } from "@thorium/routes/quickStart/quickStartContext";
import { Outlet } from "react-router";

export default function QuickStartLayout() {
	return (
		<FlightQuickStartProvider>
			<Outlet />
		</FlightQuickStartProvider>
	);
}
