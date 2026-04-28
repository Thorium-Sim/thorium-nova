import { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";
import { DataStore } from "@thorium/utils/.server/db-fs";
import randomWords from "@thorium/utils/random-words";

export const databaseName =
	process.env.NODE_ENV === "production"
		? /* istanbul ignore next */
			"db.yml"
		: process.env.NODE_ENV === "test"
			? "db-test.yml"
			: /* istanbul ignore next */
				"db-dev.yml";

export async function buildDatabase(loadPlugins: (this: ServerDataModel) => Promise<void>) {
	// Create the primary database
	// This is for any user data that is persisted between flights
	// but that isn't part of a plugin. Not much goes in here.
	const serverModel = new ServerDataModel(
		{ thoriumId: randomWords(3).join("-"), activeFlightName: null },
		{ meta: { filePath: databaseName } },
		loadPlugins,
	);
	// Wait for the plugins to load. Shouldn't take long.
	await serverModel.loadPlugins();

	// If a flight is in progress, load it.
	// This helps in situations where the server is shut
	// down or crashes unexpectedly.
	let flight = null;
	if (serverModel.activeFlightName) {
		const flightName = serverModel.activeFlightName;
		flight = new FlightDataModel(
			{
				name: flightName,
				initialLoad: false,
				entities: [],
				serverDataModel: serverModel,
			},
			{ meta: { filePath: `/flights/${flightName}/data.yml`, flightName } },
		);

		await flight.initEcs(serverModel);
		await flight.initPhysics();
	}
	DataStore.operations.getStore()!.database = { server: serverModel, flight };
	return DataStore.operations.getStore()!.database;
}
