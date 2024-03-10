import os from "node:os";
const networkInterfaces = os.networkInterfaces();
let ipAddress = "localhost";
let macAddress = "00:00:00:00:00:00";

Object.keys(networkInterfaces).forEach((interfaceName) => {
	networkInterfaces[interfaceName]?.forEach((networkInterface) => {
		if (
			"IPv4" !== networkInterface.family ||
			networkInterface.internal !== false ||
			networkInterface.address.startsWith("169.")
		) {
			// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
			return;
		}
		/* istanbul ignore next */
		ipAddress = networkInterface.address;
		macAddress = networkInterface.mac;
	});
});

export { ipAddress, macAddress };
