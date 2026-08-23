import { Electroview } from "electrobun/view";

const logs = document.getElementById("logs")!;

const rpc = Electroview.defineRPC({
	maxRequestTime: 10_000,
	handlers: {
		requests: {},
		messages: {
			logMessage: ({ message }) => {
				logs.innerText = message;
			},
		},
	},
});

new Electroview({ rpc });

rpc.send.rendererReady({ title: document.title });
