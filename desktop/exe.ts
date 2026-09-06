import "reflect-metadata";
import { startHttpServer } from "../app/bunServer";
startHttpServer({ isProd: true }).catch((error) => console.info("Error starting Thorium", error));
