import type {FlightDataModel} from "../classes/FlightDataModel";
import {promises as fs} from "fs";
import {thoriumPath} from "./appPaths";
import {parse} from "yaml";

export async function getFlights() {
  let files: string[];
  try {
    files = await fs.readdir(`${thoriumPath}/flights/`);
  } catch {
    await fs.mkdir(`${thoriumPath}/flights/`);
    files = [];
  }
  const flightFiles = files.filter(f => f.includes(".flight"));
  const flightData = await Promise.all(
    flightFiles.map(async flightName => {
      const raw = await fs.readFile(
        `${thoriumPath}/flights/${flightName}`,
        "utf-8"
      );
      const data = parse(raw);
      return {...data, date: new Date(data.date)} as FlightDataModel;
    })
  );
  return flightData;
}
