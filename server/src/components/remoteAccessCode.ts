import {Component} from "./utils";

export class RemoteAccessCodeComponent extends Component {
  static id = "remoteAccessCode" as const;

  shipId: number = -1;
  clientId: string = "";
  station: string | null | undefined = "";
  code: string = "";
  state: "waiting" | "accepted" | "denied" = "waiting";
  timestamp: number = Date.now();
}
