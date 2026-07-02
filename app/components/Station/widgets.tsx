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
							<SVGImageLoader className="widget-icon h-6 w-6 cursor-pointer" url={widget.icon} />
						}
						component={WidgetComp}
						size={widget.size}
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
	icon: IconType;
	component: ComponentType<{
		cardLoaded: boolean;
		isOpen: boolean;
		onClose: () => void;
	}>;
	size?: "sm" | "md" | "lg" | "xl";
}> = ({ name, icon, component: Component, size = "md" }) => {
	const [isOpen, setIsOpen] = useState<"off" | "popover" | "modal">("off");
	const modalRef = useRef<HTMLDivElement>(null);
	const positionRef = useRef<[number, number]>([0, 0]);
	const sizeClass = cn(
		"max-w-md isolate max-h-96 !bg-black/70 border border-white/50 rounded p-2 relative w-screen @container overflow-hidden flex flex-col",
		"panel backdrop-blur transition-none!",
		{
			"max-w-sm": size === "sm",
			"max-w-lg": size === "md",
			"max-w-xl": size === "lg",
			"max-w-2xl": size === "xl",
		},
	);
	const card = (
		<CardProvider cardLoaded={isOpen !== "off"} cardName={name} isWidget>
			<Component
				cardLoaded={isOpen !== "off"}
				isOpen={isOpen !== "off"}
				onClose={() => setIsOpen("off")}
			/>
		</CardProvider>
	);
	return (
		<>
			{isOpen === "modal" ? (
				<div className={cn(sizeClass, "fixed top-0 left-0 z-150 pt-4")} ref={modalRef}>
					<div className="absolute top-2 right-2 flex gap-2">
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
						<Button className="btn btn-circle btn-xs btn-error" onClick={() => setIsOpen("off")}>
							<Icon name="x" />
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
					{typeof icon === "string" ? (
						<Icon name={icon} className="widget-icon h-6 w-6 cursor-pointer" />
					) : (
						icon
					)}
				</RAButton>
				<Suspense>
					<Popover className={cn("theme-container", popoverTransitionClasses)}>
						<Dialog className={sizeClass}>
							<Button
								className="btn btn-circle btn-xs btn-accent absolute top-2 right-2"
								onClick={() => setIsOpen("modal")}
							>
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
