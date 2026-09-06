const exitFunctions = new Set<() => Promise<void> | void>();

export function registerExitFunction(fn: () => Promise<void> | void) {
	exitFunctions.add(fn);
	return () => exitFunctions.delete(fn);
}

export function exit() {
	exitHandler({ cleanup: true, exit: true });
}
async function exitHandler(options: { cleanup?: boolean; exit?: boolean }) {
	if (options.cleanup) {
		for (const fn of exitFunctions) {
			try {
				await fn();
			} catch {}
		}
	}
	if (options.exit) process.exit();
}

export function setupExitHandler(isProd: boolean) {
	if (!isProd) return;
	process.stdin.resume(); //so the program will not close instantly

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
