import {OfflineStates} from "../utils/types";
import {BaseClient} from "./BaseClient";

/**
 * Properties which are associated between a flight and a client.
 * These properties are stored on the flight and then merged
 * back to the client when the flight is in progress.
 */

export class FlightClient extends BaseClient {
  flightId: string;
  shipId: number | null;
  stationId: string | null;
  loginName: string;
  offlineState: "blackout" | {title: string; message: string} | null;
  training: boolean;
  constructor(params: {id: string} & Partial<FlightClient>) {
    super(params.id);
    if (!params.flightId)
      throw new Error("Error creating flight client: FlightID is required");
    this.flightId = params.flightId;
    this.shipId = params.shipId ?? null;
    this.stationId = params.stationId ?? null;
    this.loginName = params.loginName ?? "";
    this.offlineState = params.offlineState || null;
    this.training = params.training || false;
  }
  toJSON() {
    return {
      id: this.id,
      flightId: this.flightId,
      shipId: this.shipId,
      stationId: this.stationId,
      loginName: this.loginName,
      offlineState: this.offlineState,
      training: this.training,
    };
  }
}
