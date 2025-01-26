import {
	FSDataStore,
	type FSDataStoreOptions,
} from "@thorium/utils/.server/db-fs";
import { thoriumPath } from "../../utils/.server/appPaths";
import { Client } from "../init/liveQuery";
import BasePlugin from "./Plugins";
import { router } from "@thorium/.server/init/router";
import { pubsub } from "@thorium/.server/init/pubsub";
import randomWords from "@thorium/utils/random-words";

export class ServerDataModel extends FSDataStore {
	clients!: Record<string, Client<any>>;
	thoriumId!: string;
	activeFlightName!: string | null;
	plugins: BasePlugin[] = [];
	constructor(params: Partial<ServerDataModel>, options: FSDataStoreOptions) {
		super(params, options);
		const data = this.getData();
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
	}
	loadPlugins = async () => {
		const plugins = new Bun.Glob(`${thoriumPath}/plugins/*/manifest.yml`).scan({
			onlyFiles: true,
		});
		const pluginRegex = new RegExp(`${thoriumPath}/plugins/(.*)/manifest.yml`);
		for await (const plugin of plugins) {
			const name = pluginRegex.exec(plugin)![1];
			try {
				this.plugins.push(new BasePlugin({ name }, this));
			} catch (err) {
				console.error(`Error loading plugin ${name}:`, err);
			}
		}
		if (this.plugins.length === 0)
			throw new Error("Thorium Nova requires at least one plugin to run.");
	};
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
