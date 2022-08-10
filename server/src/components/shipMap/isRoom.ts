import {NodeFlag} from "server/src/classes/Plugins/Ship/Deck";
import {Component} from "../utils";

export class IsRoomComponent extends Component {
  static id = "isRoom" as const;

  flags: NodeFlag[] = [];
}
