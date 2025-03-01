import * as Cards from "@thorium/cards";
import { q, clientId } from "@thorium/context/AppContext";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import {
	type ComponentType,
	type FC,
	type ReactElement,
	type ReactNode,
	useState,
} from "react";
import { Popover, Transition } from "@headlessui/react";
import {
	autoUpdate,
	useClick,
	useDismiss,
	useFloating,
	useInteractions,
} from "@floating-ui/react";
import { Icon, type IconName } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import { useNavigate } from "react-router";

type IconType = IconName | ReactElement;

export const Widgets = () => {
	const [station] = q.station.get.useNetRequest({ clientId });

	return (
		<>
			{/* <Widget icon={RiPictureInPictureLine} component={ViewscreenWidget} /> */}
			{station.widgets?.map((widget) => {
				const WidgetComp = Cards[widget.component as keyof typeof Cards];
				if (!widget.icon) return null;
				return (
					<Widget
						name={widget.name}
						key={widget.component}
						icon={
							<SVGImageLoader
								className="widget-icon w-6 h-6 cursor-pointer"
								url={widget.icon}
							/>
						}
						component={WidgetComp}
						size={widget.size}
					/>
				);
			})}
			<SettingsWidget />
			<ClickWidget
				icon="log-out"
				onClick={() => q.client.logout.netSend({ clientId })}
			/>
		</>
	);
};

export const ClickWidget: FC<{
	icon: IconType;
	onClick: () => void;
	children?: ReactNode;
}> = ({ icon, onClick, children }) => {
	return (
		<button className="widget" onClick={onClick}>
			{typeof icon === "string" ? (
				<Icon name={icon} className="widget-icon h-6 w-6 cursor-pointer" />
			) : (
				icon
			)}
			{children}
		</button>
	);
};
export const Widget: FC<{
	name: string;
	icon: IconType;
	component: ComponentType<{
		cardLoaded: boolean;
		isOpen: boolean;
		onClose: () => void;
	}>;
	size?: "sm" | "md" | "lg" | "xl";
}> = ({ name, icon, component: Component, size = "sm" }) => {
	const [isOpen, setIsOpen] = useState(false);

	const { x, y, strategy, refs, context, update } = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		placement: "top-end",
		whileElementsMounted: autoUpdate,
	});

	const dismiss = useDismiss(context);

	const click = useClick(context);

	const { getReferenceProps, getFloatingProps } = useInteractions([
		click,
		dismiss,
	]);

	return (
		<Popover className="relative">
			<Popover.Button
				className="widget"
				ref={refs.setReference}
				{...getReferenceProps()}
			>
				{typeof icon === "string" ? (
					<Icon name={icon} className="widget-icon h-6 w-6 cursor-pointer" />
				) : (
					icon
				)}
			</Popover.Button>
			<Transition>
				<Popover.Panel
					className={cn(
						"max-w-md absolute isolate right-0 max-h-96 z-50 !bg-black/90 panel backdrop-blur border border-white/50 rounded p-2 w-screen @container overflow-hidden",
						{
							"max-w-sm": size === "sm",
							"max-w-lg": size === "md",
							"max-w-xl": size === "lg",
							"max-w-2xl": size === "xl",
						},
						"z-40 relative scale-100 ease-out",
						"data-[closed]:opacity-0 data-[closed]:scale-95",
						"data-[enter]:duration-100",
						"data-[leave]:duration-75",
					)}
					ref={refs.setFloating}
					style={{
						position: strategy,
						top: y ?? 0,
						left: x ?? 0,
					}}
					{...getFloatingProps()}
				>
					<Component
						cardLoaded={isOpen}
						isOpen={isOpen}
						onClose={() => setIsOpen(false)}
					/>
				</Popover.Panel>
			</Transition>
		</Popover>
	);
};

function SettingsWidget() {
	const navigate = useNavigate();
	return <ClickWidget icon="settings" onClick={() => navigate("settings")} />;
}
