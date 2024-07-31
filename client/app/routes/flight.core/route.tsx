import Menubar, { useMenubar } from "@thorium/ui/Menubar";
import Button from "@thorium/ui/Button";
import type { Layout } from "@client/utils/FlexLayout";
import { useRef } from "react";
import "@client/utils/FlexLayout/dark.css";
import { AddCoreCombobox } from "./AddCoreCombobox";
import { CoreFlexLayout } from "./CoreFlexLayout";
import { ErrorBoundary } from "react-error-boundary";
import { CoreFlexLayoutProvider } from "./CoreFlexLayoutContext";
import { CoreFlexLayoutDropdown } from "./CoreFlexLayoutDropdown";
import { q } from "@client/context/AppContext";
import { capitalCase } from "change-case";
import { Icon } from "@thorium/ui/Icon";
import { Link } from "@remix-run/react";

export default function FlightDirectorLayout() {
	const layoutRef = useRef<Layout>(null);
	return (
		<CoreFlexLayoutProvider>
			<div className="h-full flex flex-col backdrop-blur">
				<Menubar>
					<div className="relative flex-1">
						<CoreMenubar layoutRef={layoutRef} />
						<CoreFlexLayout ref={layoutRef} />
					</div>
				</Menubar>
			</div>
		</CoreFlexLayoutProvider>
	);
}

function CoreMenubar({ layoutRef }: { layoutRef: React.RefObject<Layout> }) {
	useMenubar({
		children: (
			<>
				<Link to="/flight/lobby" className="btn btn-primary btn-xs btn-outline">
					<Icon name="arrow-left" />
				</Link>
				<AddCoreCombobox
					onChange={(coreName) => {
						layoutRef.current?.addTabToActiveTabSet?.({
							component: coreName,
							name: capitalCase(coreName.replace("Core", "")),
						});
					}}
				/>
				<ErrorBoundary fallback={null}>
					<CoreFlexLayoutDropdown />
				</ErrorBoundary>
			</>
		),
	});
	return null;
}
