import Store from "electron-store";

export const settings = new Store<{ recentDocs: string[] }>({
	defaults: {
		recentDocs: [],
	},
});

export const port = Number(process.env.PORT) || 4444;
