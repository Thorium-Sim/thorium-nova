import {DataContext} from "./DataContext";

export default function inputAuth(context: DataContext) {
  if (!context.client.isHost)
    throw new Error(
      "Unauthorized. You must be host to perform that operation."
    );
}
