import {startUp} from "..";

describe("server", () => {
  it("properly boots up", async () => {
    const res = await startUp();
    const {server, apollo, httpServer} = res || {};
    expect(server).toBeTruthy();

    expect(httpServer).toBeTruthy();
    apollo?.stop();
    httpServer?.close();
  });
});
