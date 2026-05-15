import CardProvider from "@thorium/context/CardContext";
import * as Cores from "@thorium/cores";
import { useStation } from "@thorium/routes/station/useStation";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import { Layout, TabNode } from "@thorium/utils/FlexLayout";
import { forwardRef, Suspense, useContext, useEffect, useState } from "react";
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

import { CoreFlexLayoutContext } from "./CoreFlexLayoutContext";

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

export function useActiveCores() {
	const { layoutModel } = useContext(CoreFlexLayoutContext);

	const nodes: { component: string; activate: () => void }[] = [];
	layoutModel.visitNodes((node) => {
		const component = node.getAttr("component");
		if (component) {
			nodes.push({
				component,
				activate() {
					if (node instanceof TabNode) {
						node.activate();
					}
				},
			});
		}
	});
	return nodes;
}
