import { cn } from "@thorium/utils/cn";

import "./stars.css";
import type { ReactNode } from "react";

const Stars = ({ children, className }: { children?: ReactNode; className?: string }) => {
	return (
		<div
			className={cn(
				"h-full min-h-[calc(100vh-30px)] flex-1 flex flex-col justify-center items-center stars-container relative",
				className,
			)}
		>
			<div className="pointer-events-none absolute top-0 left-0">
				<div id="stars" />
				<div id="stars2" />
				<div id="stars3" />
			</div>
			{children}
		</div>
	);
};

export default Stars;
