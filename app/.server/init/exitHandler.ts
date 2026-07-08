import { thoriumContext, type ThoriumContext } from "@thorium/utils/.server/context";

const exitFunctions = new Set<() => Promise<void> | void>();

export function registerExitFunction(fn: () => Promise<void> | void) {
	exitFunctions.add(fn);
	return () => exitFunctions.delete(fn);
}

export function exitHandler(operations: ThoriumContext) {
	if (process.env.NODE_ENV === "production") {
		process.stdin.resume(); //so the program will not close instantly

		async function exitHandler(options: { cleanup?: boolean; exit?: boolean }) {
			if (options.cleanup) {
				await thoriumContext.run(operations, async () => {
					for (const fn of exitFunctions) {
						try {
							await fn();
						} catch {}
					}
				});
			}
			if (options.exit) process.exit();
		}

		//do something when app is closing
		process.on("exit", exitHandler.bind(null, { cleanup: false }));

		//catches ctrl+c event
		process.on("SIGINT", exitHandler.bind(null, { exit: true, cleanup: true }));

		// catches "kill pid" (for example: nodemon restart)
		process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
		process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

		//catches uncaught exceptions
		process.on("uncaughtException", exitHandler.bind(null, { exit: true }));
	}
}
