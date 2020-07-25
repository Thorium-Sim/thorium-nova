import {startUp} from "..";

describe("server", () => {
  it("properly boots up", async () => {
    const res = await startUp();
    const {server, apollo, httpServer, bonjour, bonjourService} = res || {};
    expect(server).toBeTruthy();
    bonjourService?.stop(() => {});
    bonjour?.destroy();

    expect(httpServer).toBeTruthy();
    apollo?.stop();
    httpServer?.close();
  });
});
