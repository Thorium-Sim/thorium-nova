import os from "os";
const networkInterfaces = os.networkInterfaces();
let ipAddress = "localhost";

Object.keys(networkInterfaces).forEach(function (interfaceName) {
  networkInterfaces[interfaceName]?.forEach(function (networkInterface) {
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
  });
});

export default ipAddress;
