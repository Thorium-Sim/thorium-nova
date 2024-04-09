import { database } from "./buildDatabase";

export function exitHandler() {
	if (process.env.NODE_ENV === "production") {
		process.stdin.resume(); //so the program will not close instantly

		async function exitHandler(
			options: { cleanup?: boolean; exit?: boolean },
			exitCode: number,
		) {
			if (options.cleanup) {
				await snapshot();
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

export async function snapshot() {
	await database.server.writeFile(true);
	await Promise.all(
		database.server.plugins.map(async (plugin) => {
			await plugin.writeFile(true);
		}),
	);
	await database.flight?.writeFile(true);
}
