// Use this file for any shims that should be executed before anything else is loaded.
import dotenv from "dotenv";
import "reflect-metadata";

export default async function init() {
  dotenv.config({
    debug: process.env.NODE_ENV === "development",
    path: `${__dirname}/../../.env`,
  });
}
