import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { cn } from "@thorium/utils/cn";
import { type ReactNode } from "react";
import {
	Dialog,
	ModalOverlay,
	Modal as RAModal,
	Button as RAButton,
	Heading,
} from "react-aria-components";

import { Icon } from "./Icon";

export default function Modal({
	title,
	isOpen,
	setIsOpen,
	children,
	panelClassName = "",
}: {
	title: string;
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	children: ReactNode;
	className?: string;
	panelClassName?: string;
}) {
	return (
		<ModalOverlay
			isOpen={isOpen}
			onOpenChange={(isOpen) => setIsOpen(isOpen)}
			className={cn(
				"fixed inset-0 z-10 overflow-y-auto bg-black/40 flex min-h-full w-full items-center justify-center p-4 backdrop-blur",
				"transition-all duration-200 data-[entering]:opacity-0 data-[exiting]:opacity-0",
			)}
		>
			<RAModal className={`theme-container ${popoverTransitionClasses}`}>
				<Dialog
					className={cn(
						`m:w-full mx-8 inline-block transform rounded-lg bg-gray-900/50 px-4 pt-5 pb-4 text-left align-bottom text-white shadow-xl backdrop-blur backdrop-filter transition-all sm:my-8 sm:p-6 sm:align-middle`,
						panelClassName,
					)}
				>
					<div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
						<RAButton slot="close" type="button" className="btn btn-ghost">
							<span className="sr-only">Close</span>
							<Icon name="x" className="h-6 w-6" aria-hidden="true" />
						</RAButton>
					</div>
					<Heading slot="title" className="text-4xl leading-6 font-medium">
						{title}
					</Heading>
					{children}
				</Dialog>
			</RAModal>
		</ModalOverlay>
	);
}
