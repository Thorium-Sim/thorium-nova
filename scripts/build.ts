import concurrently from "concurrently";

concurrently(
	[
		{
			command: "npm run build --workspace server",
			name: "server",
			prefixColor: "blue.bold",
		},
		{
			command: "npm run build --workspace desktop",
			name: "desktop",
			prefixColor: "green.bold",
		},
		{
			command:
				"NODE_OPTIONS=--max-old-space-size=32768 npm run build --workspace client",
			name: "client",
			prefixColor: "magenta.bold",
		},
	],
	{
		killOthers: "failure",
		maxProcesses: 1,
	},
);
