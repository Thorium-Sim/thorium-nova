import { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";
import { databaseName } from "@thorium/utils/.server/appPaths";
import randomWords from "@thorium/utils/random-words";
import { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";

export let database: {
	server: ServerDataModel;
	flight: FlightDataModel | null;
};
export async function buildDatabase() {
	// Create the primary database
	// This is for any user data that is persisted between flights
	// but that isn't part of a plugin. Not much goes in here.
	const serverModel = new ServerDataModel(
		{ thoriumId: randomWords(3).join("-"), activeFlightName: null },
		{ path: databaseName },
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
			{ path: `/flights/${flightName}.flight` },
		);

		await flight.initEcs(serverModel);
		await flight.initPhysics();
	}
	database = { server: serverModel, flight };

	return database;
}
