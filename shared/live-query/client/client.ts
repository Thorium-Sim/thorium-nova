import { NETREQUEST_PATH, NETSEND_PATH } from "../constants";

type HTTPHeaders = Record<string, string>;

export type HeadersResolver =
	| HTTPHeaders
	| (() => HTTPHeaders | Promise<HTTPHeaders>);
export type LiveQueryClientOptions = {
	baseUrl?: string;
	netSendPath?: string;
	netRequestPath?: string;
	headers?: HeadersResolver;
};
type RequestOptions = {
	signal?: AbortSignal;
	headers?: HeadersResolver;
	path: string;
	input: any;
};

export class LiveQueryClient {
	requestUrl: URL;
	sendUrl: URL;
	headers: HTTPHeaders | (() => HTTPHeaders | Promise<HTTPHeaders>);
	constructor({
		baseUrl = typeof window === "undefined"
			? "http://localhost:4444"
			: window.location.origin,
		netRequestPath = NETREQUEST_PATH,
		netSendPath = NETSEND_PATH,
		headers = {},
	}: LiveQueryClientOptions = {}) {
		this.requestUrl = new URL(netRequestPath, baseUrl);
		this.sendUrl = new URL(netSendPath, baseUrl);
		this.headers = headers;
	}
	private async makeRequest(
		url: URL,
		body: any,
		signal?: AbortSignal,
		inputHeaders?: HeadersResolver,
	) {
		const headers = new Headers();
		Object.entries(
			typeof this.headers === "function" ? await this.headers() : this.headers,
		).forEach(([key, val]) => {
			headers.append(key, val);
		});
		Object.entries(
			typeof inputHeaders === "function"
				? await inputHeaders()
				: inputHeaders || {},
		).forEach(([key, val]) => {
			headers.append(key, val);
		});

		if (typeof body === "string") {
			headers.append("content-type", "application/json");
		}
		let result: any = await fetch(url, {
			method: "POST",
			headers,
			body,
			signal,
		}).then((res) => {
			if (!res.ok) throw new Error(res.statusText);
			return res.text();
		});

		try {
			result = JSON.parse(result);
		} catch {
			// Not JSON, apparently
		}
		if (result?.error) {
			throw new Error(result.error);
		}

		return result;
	}
	async netRequest(opts: RequestOptions) {
		return await this.makeRequest(
			this.requestUrl,
			JSON.stringify({ path: opts.path, ...opts.input }),
			opts.signal,
			opts.headers,
		);
	}
	async netSend(opts: RequestOptions) {
		const body = new FormData();
		body.append("path", opts.path);
		let count = 0;
		for (const key in opts.input) {
			const value = opts.input[key];
			if (value instanceof File) {
				body.append(key, value);
				opts.input[key] = {} as any;
			} else if (value instanceof Blob) {
				body.append(key, value, `blob-${count++}`);
				opts.input[key] = {} as any;
			} else if (value instanceof FileList) {
				for (let i = 0; i < value.length; i++) {
					body.append(`${key}[]`, value[i]);
				}
				opts.input[key] = [] as any;
			}
		}
		body.append("params", JSON.stringify(opts.input));

		return await this.makeRequest(
			this.sendUrl,
			body,
			opts.signal,
			opts.headers,
		);
	}
}
