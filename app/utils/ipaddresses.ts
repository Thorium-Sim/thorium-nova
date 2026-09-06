import os from "os";
const interfaces = os.networkInterfaces();
export let ipAddresses: string[] = [];
for (const key in interfaces) {
	const int = interfaces[key];
	if (int) {
		for (const i of int) {
			if (i.family === "IPv4") {
				ipAddresses.push(i.address);
			}
		}
	}
}
