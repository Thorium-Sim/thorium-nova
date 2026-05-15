import { pubsub } from "@thorium/.server/init/pubsub";
import { router } from "@thorium/.server/init/router";
import { DataStore, type DataStoreOptions } from "@thorium/utils/.server/db-fs";
import randomWords from "@thorium/utils/random-words";

import { Client } from "../init/liveQuery";
import type BasePlugin from "./Plugins";
export class ServerDataModel extends DataStore {
	clients!: Record<string, Client<any>>;
	thoriumId!: string;
	activeFlightName!: string | null;
	plugins: BasePlugin[] = [];
	constructor(
		params: Partial<ServerDataModel>,
		options: DataStoreOptions,
		private loadPluginsImpl: (this: ServerDataModel) => Promise<void>,
	) {
		super(params, options);
		this.getData<ServerDataModel>().then((data) => {
			this.activeFlightName = data.activeFlightName || null;
			this.thoriumId = data.thoriumId || randomWords(3).join("-");
			this.spawnClients(this.clients || data.clients || {});
		});
	}
	spawnClients(clients: Record<string, Client<any>>) {
		this.clients = Object.fromEntries(
			Object.entries(clients).map(([id, client]: any) => {
				const c = new Client(client.id, router, pubsub);
				c.name = client.name;
				c.settings = client.settings || c.settings;
				return [id, c];
			}),
		);
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
