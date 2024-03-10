import StationComplementPlugin from "./StationComplement";
import Plugin from "./index";
import type {ServerDataModel} from "../ServerDataModel";

describe("StationComplementPlugin", () => {
  it("should instantiate correctly", async () => {
    const plugin = new Plugin({}, {plugins: []} as unknown as ServerDataModel);
    const stationComplement = new StationComplementPlugin({}, plugin);
    expect(stationComplement).toBeInstanceOf(StationComplementPlugin);
    expect(stationComplement.name).toBe("New Station Complement");
    expect(stationComplement.stationCount).toBe(0);
  });
});
