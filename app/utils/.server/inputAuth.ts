import type { DataContext } from "@thorium/.server/DataContext";

export default function inputAuth(_: DataContext) {
	// This is dumb.
	// if (!context.isHost)
	// 	throw new Error(
	// 		"Unauthorized. You must be host to perform that operation.",
	// 	);
}
