import * as React from "react";
import type { ReactNode } from "react";

export const CopyToClipboard: React.FC<
	{
		text: string;
		copyContents?: ReactNode;
	} & React.HTMLAttributes<HTMLButtonElement>
> = ({ text, children, copyContents = <span>Copied! 👍</span>, ...props }) => {
	const [contents, setContents] = React.useState(children);
	const timeoutRef = React.useRef<any>();
	const copyToClipboard = async (
		event: React.MouseEvent<HTMLButtonElement>,
		str: string,
	) => {
		await navigator.clipboard.writeText(str);
		setContents(copyContents);
		clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			setContents(children);
		}, 3000);
		props.onClick?.(event);
	};
	React.useEffect(() => {
		return () => clearTimeout(timeoutRef.current);
	}, []);

	return (
		<button
			{...props}
			onClick={(e) => {
				copyToClipboard(e, text);
				return {};
			}}
		>
			{contents}
		</button>
	);
};
