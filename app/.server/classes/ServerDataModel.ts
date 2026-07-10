import { pubsub } from "@thorium/.server/init/pubsub";
import { router } from "@thorium/.server/init/router";
import { DataStore, type DataStoreOptions } from "@thorium/utils/.server/db-fs";
import { getPluginTextPatterns } from "@thorium/utils/interpolationEngine";
import randomWords from "@thorium/utils/random-words";

import { Client } from "../init/liveQuery";
import type BasePlugin from "./Plugins";
export class ServerDataModel extends DataStore {
	clients!: Record<string, Client<any>>;
	thoriumId!: string;
	activeFlightName!: string | null;
	plugins: BasePlugin[] = [];

	flightNameTemplate!: string;
	clientNameTemplate!: string;
	constructor(
		params: Partial<ServerDataModel>,
		options: DataStoreOptions,
		private loadPluginsImpl: (this: ServerDataModel) => Promise<void>,
	) {
		super(params, options);
	}
	spawnClients(clients: Record<string, Client<any>>) {
		this.clients = Object.fromEntries(
			Object.entries(clients).map(([id, client]: any) => {
				const c = new Client(this, client.id, router, pubsub);
				c.name = client.name;
				c.settings = client.settings || c.settings;
				return [id, c];
			}),
		);
	}
	async getInitialData() {
		const data = await this.getData<ServerDataModel>();
		this.activeFlightName = data.activeFlightName || null;
		this.thoriumId = data.thoriumId || randomWords(3).join("-");

		console.trace();
		// Make sure we have a Flight Names in the plugins. It very unlikely that there wouldn't be
		this.flightNameTemplate =
			data.flightNameTemplate || getPluginTextPatterns(this)["Flight Names"]
				? "{#Flight Names}"
				: "{~Alpha,Bravo,Charlie,Delta,Echo} {~1,2,3,4,5,6,7,8}";
		this.clientNameTemplate =
			data.clientNameTemplate || getPluginTextPatterns(this)["Client Names"]
				? "{#Client Names}"
				: "{~Red,Orange,Yellow,Green,Blue,Purple,Violet,Gold,Silver,White,Black} {~1,2,3,4,5,6,7,8}";
		this.spawnClients(this.clients || data.clients || {});
	}
	getClientByName(clientName: string) {
		for (const client in this.clients) {
			if (this.clients[client].name === clientName) return this.clients[client];
		}
		return null;
	}
	async loadPlugins() {
		await this.loadPluginsImpl.apply(this);

		if (this.plugins.length === 0)
			throw new Error("Thorium Nova requires at least one plugin to run.");
	}
	toJSON() {
		const { plugins: _, clients, ...data } = this;
		return {
			...data,
			clients: Object.fromEntries(
				Object.entries(clients).map(([id, client]) => [id, client.toJSON()]),
			),
		};
	}
}
