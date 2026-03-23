import * as React from "react";
import { useEffect } from "react";
import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import { Icon } from "@thorium/ui/Icon";
import {
	Disclosure,
	DisclosurePanel,
	Heading,
	Button as RAButton,
} from "react-aria-components";

const HandleIsOpen = ({
	open,
	title,
	scrollRef,
}: {
	title: string;
	open: boolean;
	scrollRef: React.RefObject<HTMLDivElement | null>;
}) => {
	const hasMounted = React.useRef(false);
	useEffect(() => {
		localStorage.setItem(`editor-palette-open-${title}`, JSON.stringify(open));
	}, [title, open]);
	React.useLayoutEffect(() => {
		if (open && hasMounted.current) {
			setTimeout(() => {
				scrollRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}, 100);
		}
		hasMounted.current = true;
	}, [open, scrollRef]);

	return null;
};

export function PaletteDisclosure({
	title,
	children,
	defaultOpen = false,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [isDefaultOpen] = useLocalStorage(
		`editor-palette-open-${title}`,
		defaultOpen,
	);
	const disclosureRef = React.useRef<HTMLDivElement>(null);
	return (
		<Disclosure defaultExpanded={isDefaultOpen}>
			{({ isExpanded }) => (
				<>
					<HandleIsOpen
						open={isExpanded}
						title={title}
						scrollRef={disclosureRef}
					/>
					<Heading
						className="w-full py-1 px-2 bg-gray-900 sticky -top-1"
						ref={disclosureRef}
					>
						<RAButton className="btn btn-notice btn-sm justify-between btn-block">
							<span>{title}</span>
							<Icon
								name="chevron-up"
								className={` transition-transform${
									isExpanded ? "transform rotate-180" : ""
								} w-5 h-5`}
							/>
						</RAButton>
					</Heading>

					<DisclosurePanel className="pt-4 pb-2 px-2 border-b border-b-gray-700">
						{children}
					</DisclosurePanel>
				</>
			)}
		</Disclosure>
	);
}
