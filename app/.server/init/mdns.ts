import ciao from "@homebridge/ciao";
import { registerExitFunction } from "@thorium/.server/init/exitHandler";
const responder = ciao.getResponder();

export async function advertiseMdns(port: number, name: string = "Thorium Nova") {
	const service = responder.createService({
		name,
		type: "http",
		port,
		hostname: "thorium.local",
		subtypes: ["thorium"],
	});
	service.on("name-change", (event) => {
		console.info("Name changed", event);
	});
	await service.advertise();

	registerExitFunction(async () => {
		await service.destroy();
	});
	return service;
}
