import {useClientData} from "../context/useCardData";
import {usePrompt} from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import {netSend} from "../context/netSend";

export function ClientButton() {
  const clientData = useClientData();
  const prompt = usePrompt();
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-white font-bold">Client Name:</h2>
      <Button
        className="btn-primary btn-sm"
        onClick={async () => {
          const name = await prompt({
            header: "What is the new client name?",
          });
          if (typeof name === "string") {
            const result = await netSend("clientSetName", {name});
          }
        }}
      >
        {clientData?.client.name || ""}
      </Button>
    </div>
  );
}
