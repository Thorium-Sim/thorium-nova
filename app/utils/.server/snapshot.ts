import type { DatabaseContext } from "@thorium/typeguards/isDatabaseContext";

export async function snapshot(database: DatabaseContext) {
	await database.server.write(true);
	await Promise.all(
		database.server.plugins.map(async (plugin) => {
			await plugin.write(true);
		}),
	);
	await database.flight?.write(true);
}
