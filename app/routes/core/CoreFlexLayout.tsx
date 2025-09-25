import { forwardRef, Suspense, useContext, useEffect, useState } from "react";
import * as Cores from "@thorium/cores";
import CardProvider from "@thorium/context/CardContext";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import { CoreFlexLayoutContext } from "./CoreFlexLayoutContext";

import { Layout, type TabNode } from "@thorium/utils/FlexLayout";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import { useStation } from "@thorium/routes/station/useStation";

export const CoreFlexLayout = forwardRef<Layout>((_, ref) => {
	const { layoutModel, setInitialModel } = useContext(CoreFlexLayoutContext);

	// A hack to make the layout properly render.
	const [, setState] = useState({});
	useEffect(() => {
		setTimeout(() => {
			setState({});
		}, 500);
	}, []);
	return (
		<Layout
			ref={ref}
			factory={flexLayoutFactory}
			model={layoutModel}
			supportsPopout={false}
			onModelChange={(a) => setInitialModel(a.toJson())}
		/>
	);
});

CoreFlexLayout.displayName = "CoreFlexLayout";

function flexLayoutFactory(node: TabNode) {
	const compName = node.getComponent() as keyof typeof Cores;

	const Core = Cores[compName];
	if (Core)
		return (
			<CardProvider cardName={compName} cardLoaded isWidget={false}>
				<ErrorBoundary
					fallback={
						<div className="p-4">
							Error loading core.
							<ErrorReset />
						</div>
					}
				>
					<Suspense fallback={<LoadingSpinner compact />}>
						<Core />
					</Suspense>
				</ErrorBoundary>
			</CardProvider>
		);
	return null;
}

function ErrorReset() {
	const { shipId } = useStation();
	const { resetBoundary } = useErrorBoundary();
	useEffect(() => {
		if (shipId) {
			resetBoundary();
		}
	}, [shipId, resetBoundary]);
	return null;
}
