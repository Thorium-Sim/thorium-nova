import { DataStore, type DataStoreOptions } from "@thorium/utils/.server/db-fs";
import { Client } from "../init/liveQuery";
import type BasePlugin from "./Plugins";
import { router } from "@thorium/.server/init/router";
import { pubsub } from "@thorium/.server/init/pubsub";
import randomWords from "@thorium/utils/random-words";
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
			if (this.clients) {
				this.clients = Object.fromEntries(
					Object.entries(this.clients).map(([id, client]) => {
						const c = new Client(client.id, router, pubsub);
						c.name = client.name;
						return [id, c];
					}),
				);
			} else {
				this.clients = Object.fromEntries(
					Object.entries(data.clients || {}).map(([id, client]: any) => {
						const c = new Client(client.id, router, pubsub);
						c.name = client.name;
						return [id, c];
					}),
				);
			}
		});
	}
	async loadPlugins() {
		await this.loadPluginsImpl.apply(this);

		if (this.plugins.length === 0)
			throw new Error("Thorium Nova requires at least one plugin to run.");
	}
	toJSON() {
		const { plugins, clients, ...data } = this;
		return {
			...data,
			clients: Object.fromEntries(
				Object.entries(clients).map(([id, client]) => [id, client.toJSON()]),
			),
		};
	}
}
