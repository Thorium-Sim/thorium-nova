import ReconnectingWebSocket from "reconnecting-websocket";

export async function loadWebSocket() {
	const url = new URL(window.location.href);
	try {
		url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
		url.pathname = "/ws";
		const socketUrl = url.toString();

		const socket = new ReconnectingWebSocket(socketUrl, [], {
			minReconnectionDelay: 500,
		});

		await new Promise<ReconnectingWebSocket>((res) => {
			socket.onopen = () => res(socket);
		});
		return socket;
	} catch (err) {
		return Promise.reject(err);
	}
}
