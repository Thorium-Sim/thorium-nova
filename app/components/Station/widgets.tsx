import { useUNSAFE_PortalContext } from "@react-aria/overlays";
import * as Cards from "@thorium/cards";
import { q, clientId } from "@thorium/context/AppContext";
import CardProvider from "@thorium/context/CardContext";
import Button from "@thorium/ui/Button";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { Icon, type IconName } from "@thorium/ui/Icon";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import { cn } from "@thorium/utils/cn";
import { pascalCase } from "change-case";
import {
	type ComponentType,
	type FC,
	type ReactElement,
	type ReactNode,
	Suspense,
	useRef,
	useState,
} from "react";
import { Button as RAButton, Dialog, DialogTrigger, Popover } from "react-aria-components";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router";
type IconType = IconName | ReactElement;

export const Widgets = () => {
	const [station] = q.station.get.useNetRequest({ clientId });

	return (
		<>
			{/* <Widget icon={RiPictureInPictureLine} component={ViewscreenWidget} /> */}
			{station.widgets?.map(({ component, icon, ...rest }) => {
				const WidgetComp = Cards[component as keyof typeof Cards];
				if (!icon) return null;
				return (
					<Widget
						key={component}
						component={component}
						{...rest}
						icon={icon}
						Component={WidgetComp}
					/>
				);
			})}
			<SettingsWidget />
			<ClickWidget icon="log-out" onClick={() => q.client.logout.netSend({ clientId })} />
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
	icon: string;
	component: string;
	Component: ComponentType<{
		cardLoaded: boolean;
		isOpen: boolean;
		onClose: () => void;
	}>;
	size?: "sm" | "md" | "lg" | "xl";
}> = ({ name, icon, component, Component, size = "md" }) => {
	const [isOpen, setIsOpen] = useState<"off" | "popover" | "modal">("off");
	const modalRef = useRef<HTMLDivElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);
	const positionRef = useRef<[number, number]>([0, 0]);
	const sizeClass = cn(
		"max-w-md isolate max-h-96 !bg-black/70 border border-white/50 rounded p-2 relative w-screen @container overflow-hidden flex flex-col",
		"panel backdrop-blur transition-none!",
		`widget-body-${pascalCase(name)}`,
		{
			"max-w-sm": size === "sm",
			"max-w-lg": size === "md",
			"max-w-xl": size === "lg",
			"max-w-2xl": size === "xl",
		},
	);
	const card = (
		<CardProvider cardLoaded={isOpen !== "off"} name={name} component={component} isWidget>
			<Component
				cardLoaded={isOpen !== "off"}
				isOpen={isOpen !== "off"}
				onClose={() => setIsOpen("off")}
			/>
		</CardProvider>
	);
	const container = useUNSAFE_PortalContext().getContainer?.();
	return (
		<>
			{isOpen === "modal" ? (
				<div className={cn(sizeClass, "fixed top-0 left-0 z-150 pt-4")} ref={modalRef}>
					<div className="absolute top-2 right-2 flex gap-2">
						<Button className="btn btn-circle btn-xs btn-error" onClick={() => setIsOpen("off")}>
							<span className="sr-only">Close Widget</span>
							<Icon name="x" />
						</Button>
						<Button
							className="btn btn-circle btn-xs"
							onPointerDown={() => {
								const abortController = new AbortController();
								const modalSize = modalRef.current?.getBoundingClientRect();
								document.addEventListener(
									"pointermove",
									(e) => {
										if (modalRef.current && modalSize) {
											positionRef.current[0] = Math.min(
												Math.max(0, positionRef.current[0] + e.movementX),
												window.innerWidth - modalSize.width,
											);
											positionRef.current[1] = Math.min(
												Math.max(0, positionRef.current[1] + e.movementY),
												window.innerHeight - modalSize.height,
											);
											modalRef.current.style.transform = `translate(${positionRef.current[0]}px, ${positionRef.current[1]}px)`;
										}
									},
									{ signal: abortController.signal },
								);
								document.addEventListener("pointerup", () => {
									abortController.abort();
								});
							}}
						>
							<Icon name="grip" />
						</Button>
					</div>
					{card}
				</div>
			) : null}
			<DialogTrigger
				isOpen={isOpen === "popover"}
				onOpenChange={(isOpen) => {
					setIsOpen(isOpen ? "popover" : "off");
					if (isOpen) {
						q.thorium.genericEvent.netSend({
							clientId,
							eventName: "widget-open",
							properties: pascalCase(name),
						});
					}
				}}
			>
				<RAButton className={`widget widget-${pascalCase(name)}`}>
					{icon.includes("/") ? (
						<SVGImageLoader className="widget-icon h-6 w-6 cursor-pointer" url={icon} />
					) : (
						<Icon name={icon as any} className="widget-icon h-6 w-6 cursor-pointer" />
					)}
				</RAButton>
				<Suspense>
					<Popover
						className={cn("theme-container", popoverTransitionClasses)}
						// We have to use the deprecated prop because for some reason the provider isn't working
						// and training doesn't get anchor positioned to widget elements due to DOM ordering
						UNSTABLE_portalContainer={container || undefined}
					>
						<Dialog className={sizeClass} ref={dialogRef}>
							<Button
								className="btn btn-circle btn-xs btn-accent widget-break-out-button absolute top-2 right-2"
								onClick={() => {
									const bounds = dialogRef.current?.getBoundingClientRect();
									flushSync(() => {
										setIsOpen("modal");
									});
									if (bounds && modalRef.current) {
										positionRef.current = [bounds.left, bounds.top];
										modalRef.current.style.transform = `translate(${positionRef.current[0]}px, ${positionRef.current[1]}px)`;
									}
									q.thorium.genericEvent.netSend({
										clientId,
										eventName: "widget-break-out",
										properties: name,
									});
								}}
							>
								<span className="sr-only">Break Out Widget</span>
								<Icon name="copy" />
							</Button>
							{card}
						</Dialog>
					</Popover>
				</Suspense>
			</DialogTrigger>
		</>
	);
};

function SettingsWidget() {
	const navigate = useNavigate();
	return (
		<ClickWidget icon="settings" className="widget-Settings" onClick={() => navigate("settings")} />
	);
}
