import type { DatabaseContext } from "@thorium/typeguards/isDatabaseContext";
import { DataStore, type DataStoreOperations } from "@thorium/utils/.server/db-fs";

export function exitHandler(operations: DataStoreOperations) {
	if (process.env.NODE_ENV === "production") {
		process.stdin.resume(); //so the program will not close instantly

		async function exitHandler(options: { cleanup?: boolean; exit?: boolean }) {
			if (options.cleanup) {
				await DataStore.operations.run(operations, async () => {
					await snapshot(operations.database);
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

export async function snapshot(database: DatabaseContext) {
	await database.server.write(true);
	await Promise.all(
		database.server.plugins.map(async (plugin) => {
			await plugin.write(true);
		}),
	);
	await database.flight?.write(true);
}
