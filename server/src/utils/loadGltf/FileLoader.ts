import { readFileSync } from "node:fs";
import { Loader } from "three";
import fetch, { Headers, Request } from "node-fetch";
import { toByteArray } from "base64-js";

const loading: {
	[key: string]: {
		onLoad?: (response: string | ArrayBuffer) => void;
		onProgress?: (event: ProgressEvent<EventTarget>) => void;
		onError?: (err: Error) => void;
	}[];
} = {};

export class FileLoader extends Loader {
	mimeType!: string;
	responseType!: string;

	async load(
		urlInput: string,
		onLoad?: (response: string | ArrayBuffer) => void,
		onProgress?: (event: ProgressEvent<EventTarget>) => void,
		onError?: (err: Error) => void,
	) {
		let url = urlInput;
		if (url === undefined) url = "";

		if (this.path !== undefined) url = this.path + url;

		url = this.manager.resolveURL(url);

		// Check if request is duplicate

		if (loading[url] !== undefined) {
			loading[url].push({
				onLoad,
				onProgress,
				onError,
			});

			return;
		}

		// Initialise array for duplicate requests
		loading[url] = [];

		loading[url].push({
			onLoad,
			onProgress,
			onError,
		});

		const mimeType = this.mimeType;
		const responseType = this.responseType;

		let result: string | ArrayBuffer;

		try {
			if (!/^https?:\/\//.test(url) && !/^data:/.test(url)) {
				const buffer = readFileSync(url);
				switch (responseType) {
					case "arraybuffer": {
						const ab = new ArrayBuffer(buffer.length);
						const view = new Uint8Array(ab);
						for (let i = 0; i < buffer.length; i++) {
							view[i] = buffer[i];
						}
						result = ab;
						break;
					}

					case "document": {
						const text = buffer.toString();
						const parser = new DOMParser();
						// @ts-ignore
						result = parser.parseFromString(text, mimeType);
						break;
					}

					case "json":
						result = JSON.parse(buffer.toString());
						break;
					default:
						result = buffer.toString();
						break;
				}
			} else if (/^data:application\/octet-stream;base64,/.test(url)) {
				const base64 = url.split(";base64,").pop() || "";
				const buffer = toByteArray(base64);

				result = buffer.buffer;
			} else {
				// create request
				const req = new Request(url, {
					headers: new Headers(this.requestHeader),
					// @ts-ignore
					credentials: this.withCredentials ? "include" : "same-origin",
					// An abort controller could be added within a future PR
				});

				// start the fetch
				result = await fetch(req)
					.then((response) => {
						if (response.status === 200 || response.status === 0) {
							// Some browsers return HTTP Status 0 when using non-http protocol
							// e.g. 'file://' or 'data://'. Handle as success.

							if (response.status === 0) {
								console.warn("THREE.FileLoader: HTTP Status 0 received.");
							}

							return response;
						}
						throw Error(
							`fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`,
						);
					})
					.then((response) => {
						switch (responseType) {
							case "arraybuffer":
								return response.arrayBuffer();

							case "blob":
								return response.blob();

							case "document":
								return response.text().then((text) => {
									const parser = new DOMParser();
									// @ts-ignore
									return parser.parseFromString(text, mimeType);
								});

							case "json":
								return response.json();

							default:
								if (mimeType === undefined) {
									return response.text();
								}
								{
									// sniff encoding
									const re = /charset="?([^;"\s]*)"?/i;
									const exec = re.exec(mimeType);
									const label = exec?.[1]?.toLowerCase();
									const decoder = new TextDecoder(label);
									return response
										.arrayBuffer()
										.then((ab) => decoder.decode(ab));
								}
						}
					});
			}

			const callbacks = loading[url];
			delete loading[url];

			for (let i = 0, il = callbacks.length; i < il; i++) {
				const callback = callbacks[i];
				if (callback.onLoad) callback.onLoad(result);
			}
		} catch (err) {
			// Abort errors and other errors are handled the same

			const callbacks = loading[url];

			if (callbacks === undefined) {
				// When onLoad was called and url was deleted in `loading`
				this.manager.itemError(url);
				throw err;
			}

			delete loading[url];

			for (let i = 0, il = callbacks.length; i < il; i++) {
				const callback = callbacks[i];
				if (callback.onError) callback.onError(err as Error);
			}

			this.manager.itemError(url);
		} finally {
			this.manager.itemEnd(url);
		}

		this.manager.itemStart(url);
	}

	setResponseType(value: string): FileLoader {
		this.responseType = value;
		return this;
	}

	setMimeType(value: string): FileLoader {
		this.mimeType = value;
		return this;
	}
}
