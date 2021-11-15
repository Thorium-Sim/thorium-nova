import StationComplementPlugin from "./StationComplement";
import Plugin from "./index";
import {ServerDataModel} from "../ServerDataModel";
import {promises as fs} from "fs";
import path from "path";
const testYaml = `apiVersion: "stations/v1"
kind: "stations"
name: "Test Station"
hasShipMap: false
stations:
  - name: Pilot
    description: A single player position that controls all aspects of the ship.
    logo: Pilot.svg
    cards:
      - name: Pilot
        component: Pilot
`;
describe("StationComplementPlugin", () => {
  afterAll(async () => {
    await fs.rm("./plugins", {recursive: true});
  });
  it("should instantiate correctly", async () => {
    const plugin = new Plugin({}, {plugins: []} as unknown as ServerDataModel);
    const stationComplement = new StationComplementPlugin({}, plugin);
    expect(stationComplement).toBeInstanceOf(StationComplementPlugin);
    expect(stationComplement.name).toBe("New Station Complement");
    expect(stationComplement.stationCount).toBe(0);
  });
  it("should load test yaml", async () => {
    const plugin = new Plugin({name: "Test Plugin"}, {
      plugins: [],
    } as unknown as ServerDataModel);
    await plugin.writeFile(true);
    await fs.mkdir(
      path.resolve(
        path.join(".", plugin.path, "../stationComplements/Test Station")
      ),
      {recursive: true}
    );
    await fs.writeFile(
      path.resolve(
        path.join(
          ".",
          plugin.path,
          "../stationComplements/Test Station/manifest.yml"
        )
      ),
      testYaml
    );
    const stationComplement = new StationComplementPlugin(
      {name: "Test Station"},
      plugin
    );
    expect(stationComplement.name).toBe("Test Station");
    expect(stationComplement.stationCount).toBe(1);
    expect(stationComplement.stations[0].name).toBe("Pilot");
    expect(stationComplement.assets["Pilot-logo"]).toBeTruthy();
  });
});
