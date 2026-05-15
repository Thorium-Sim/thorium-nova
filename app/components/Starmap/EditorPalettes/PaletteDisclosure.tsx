import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import { Icon } from "@thorium/ui/Icon";
import * as React from "react";
import { useEffect } from "react";
import { Disclosure, DisclosurePanel, Heading, Button as RAButton } from "react-aria-components";

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
	const [isDefaultOpen] = useLocalStorage(`editor-palette-open-${title}`, defaultOpen);
	const disclosureRef = React.useRef<HTMLDivElement>(null);
	return (
		<Disclosure defaultExpanded={isDefaultOpen}>
			{({ isExpanded }) => (
				<>
					<HandleIsOpen open={isExpanded} title={title} scrollRef={disclosureRef} />
					<Heading className="sticky -top-1 w-full bg-gray-900 px-2 py-1" ref={disclosureRef}>
						<RAButton className="btn btn-notice btn-sm btn-block justify-between">
							<span>{title}</span>
							<Icon
								name="chevron-up"
								className={` transition-transform${
									isExpanded ? "rotate-180 transform" : ""
								} h-5 w-5`}
							/>
						</RAButton>
					</Heading>

					<DisclosurePanel className="border-b border-b-gray-700 px-2 pt-4 pb-2">
						{children}
					</DisclosurePanel>
				</>
			)}
		</Disclosure>
	);
}
