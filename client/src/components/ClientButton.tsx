import {usePrompt} from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import {netSend} from "../context/netSend";
import {useNetRequest} from "../context/useNetRequest";

export function ClientButton() {
  const client = useNetRequest("client");

  const prompt = usePrompt();
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-white font-bold">Client Name:</h2>
      <Button
        className="btn-primary btn-sm m-0"
        onClick={async () => {
          const name = await prompt({
            header: "What is the new client name?",
          });
          if (typeof name === "string") {
            const result = await netSend("clientSetName", {name});
          }
        }}
      >
        {client.name || ""}
      </Button>
    </div>
  );
}
