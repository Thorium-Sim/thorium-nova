import {ipAddress} from ".";

describe("ipAddress", () => {
  it("should return something that looks like an ip address", () => {
    expect(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ipAddress)).toBeTruthy();
  });
});
