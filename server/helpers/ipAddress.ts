import os from "os";
const networkInterfaces = os.networkInterfaces();
let ipAddress = "localhost";

Object.keys(networkInterfaces).forEach(function (interfaceName) {
  var alias = 0;

  networkInterfaces[interfaceName]?.forEach(function (networkInterface) {
    if (
      "IPv4" !== networkInterface.family ||
      networkInterface.internal !== false
    ) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      ipAddress = networkInterface.address;
    } else {
      // this interface has only one ipv4 address
      ipAddress = networkInterface.address;
    }
    ++alias;
  });
});

export default ipAddress;
