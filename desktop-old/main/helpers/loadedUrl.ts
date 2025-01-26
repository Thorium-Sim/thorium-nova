// Used to keep a cache of the currently loaded server
// for use with creating new windows with the kiosk
let loadedUrl: string | null = null;

export function setLoadedUrl(url: string) {
	loadedUrl = url;
}

export function getLoadedUrl() {
	return loadedUrl;
}
