import app from "../app/index.html";
const server = Bun.serve({
	static: {
		"/": app,
	},

	development: true,
	async fetch(req) {
		// Return 404 for unmatched routes
		return new Response("Not Found", { status: 404 });
	},
});

console.info("Serving on port ", server.port);
