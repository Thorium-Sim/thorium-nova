import * as Cards from "@client/cards";
import { q } from "@client/context/AppContext";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import {
	ComponentPropsWithoutRef,
	type ComponentType,
	type FC,
	type ReactElement,
	type ReactNode,
	useState,
} from "react";
import { GamepadConfig, useGamepadStore } from "@client/hooks/useGamepadStore";
import { Popover, Transition } from "@headlessui/react";
import {
	useClick,
	useDismiss,
	useFloating,
	useInteractions,
} from "@floating-ui/react";
import { Icon, type IconName } from "@thorium/ui/Icon";
import { cn } from "@client/utils/cn";

type IconType = IconName | ReactElement;

export const Widgets = () => {
	const [station] = q.station.get.useNetRequest();

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
			<GamepadWidget />
			<ClickWidget icon="log-out" onClick={() => q.client.logout.netSend()} />
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

	const { x, y, strategy, refs, context } = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		placement: "top-end",
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
			<Transition
				className="relative z-40"
				enter="transition duration-100 ease-out"
				enterFrom="transform scale-95 opacity-0"
				enterTo="transform scale-100 opacity-100"
				leave="transition duration-75 ease-out"
				leaveFrom="transform scale-100 opacity-100"
				leaveTo="transform scale-95 opacity-0"
			>
				<Popover.Panel
					className={cn(
						"max-w-md absolute isolate right-0 z-50 !bg-black/90 panel backdrop-blur border border-white/50 rounded p-2 w-screen @container",
						{
							"max-w-sm": size === "sm",
							"max-w-lg": size === "md",
							"max-w-xl": size === "lg",
							"max-w-2xl": size === "xl",
						},
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

function GamepadWidget() {
	const [configOpen, setConfigOpen] = useState(false);
	const hasGamepad = useGamepadStore(
		(store) => store.gamepads.filter(Boolean).length > 0,
	);
	if (!hasGamepad) return null;
	return (
		<>
			<ClickWidget icon="joystick" onClick={() => setConfigOpen(true)} />
			<GamepadConfig
				isOpen={configOpen}
				setIsOpen={() => setConfigOpen(false)}
			/>
		</>
	);
}
