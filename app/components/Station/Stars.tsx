import type { ReactNode } from "react";
import "./stars.css";
import { cn } from "@thorium/utils/cn";

const Stars = ({
	children,
	className,
}: { children?: ReactNode; className?: string }) => {
	return (
		<div
			className={cn(
				"h-full min-h-[calc(100vh-30px)] flex-1 flex flex-col justify-center items-center stars-container relative",
				className,
			)}
		>
			<div className="absolute left-0 top-0 pointer-events-none">
				<div id="stars" />
				<div id="stars2" />
				<div id="stars3" />
			</div>
			{children}
		</div>
	);
};

export default Stars;
