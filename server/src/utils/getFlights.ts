import type {FlightDataModel} from "../classes/FlightDataModel";
import {promises} from "fs";
import {thoriumPath} from "./appPaths";
import {parse} from "yaml";

const fs =
  process.env.NODE_ENV === "test"
    ? {readdir: () => [], readFile: () => "", mkdir: () => {}}
    : promises;

const flightMap = new Map<string, FlightDataModel>();

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
      if (flightMap.has(flightName)) return flightMap.get(flightName);
      const raw = await fs.readFile(
        `${thoriumPath}/flights/${flightName}`,
        "utf-8"
      );
      const data = parse(raw);
      flightMap.set(flightName, {
        ...data,
        date: new Date(data?.date),
      } as FlightDataModel);
      return flightMap.get(flightName);
    })
  );
  return flightData as FlightDataModel[];
}
