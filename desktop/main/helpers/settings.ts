import Store from "electron-store";

export const settings = new Store<{recentDocs: string[]}>({
  defaults: {
    recentDocs: [],
  },
});
