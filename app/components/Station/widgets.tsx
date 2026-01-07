import * as Cards from "@thorium/cards";
import { q, clientId } from "@thorium/context/AppContext";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import {
	type ComponentType,
	type FC,
	type ReactElement,
	type ReactNode,
	Suspense,
	useState,
} from "react";
import { Icon, type IconName } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import { useNavigate } from "react-router";
import CardProvider from "@thorium/context/CardContext";
import { Button, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { pascalCase } from "change-case";

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
	className?: string;
}> = ({ icon, onClick, children, className }) => {
	return (
		<button className={cn("widget", className)} onClick={onClick}>
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
}> = ({ name, icon, component: Component, size = "md" }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<DialogTrigger>
			<Button className={`widget widget-${pascalCase(name)}`}>
				{typeof icon === "string" ? (
					<Icon name={icon} className="widget-icon h-6 w-6 cursor-pointer" />
				) : (
					icon
				)}
			</Button>
			<Suspense>
				<Popover className={cn("theme-container", popoverTransitionClasses)}>
					<Dialog
						className={cn(
							"max-w-md isolate max-h-96 !bg-black/70 panel backdrop-blur border border-white/50 rounded p-2 w-screen @container overflow-hidden flex flex-col",
							{
								"max-w-sm": size === "sm",
								"max-w-lg": size === "md",
								"max-w-xl": size === "lg",
								"max-w-2xl": size === "xl",
							},
						)}
					>
						<CardProvider cardLoaded={isOpen} cardName={name} isWidget>
							<Component
								cardLoaded={isOpen}
								isOpen={isOpen}
								onClose={() => setIsOpen(false)}
							/>
						</CardProvider>
					</Dialog>
				</Popover>
			</Suspense>
		</DialogTrigger>
	);
};

function SettingsWidget() {
	const navigate = useNavigate();
	return (
		<ClickWidget
			icon="settings"
			className="widget-Settings"
			onClick={() => navigate("settings")}
		/>
	);
}
