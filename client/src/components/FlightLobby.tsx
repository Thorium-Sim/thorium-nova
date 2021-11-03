import {useNavigate} from "react-router-dom";
import {useThorium} from "../context/ThoriumContext";
import {useClientData} from "../context/useCardData";
import {usePrompt} from "@thorium/ui/AlertDialog";
import {FaSpinner} from "react-icons/fa";
import Button from "@thorium/ui/Button";
import {netSend} from "../context/netSend";

export function FlightLobby() {
  const prompt = usePrompt();
  const navigate = useNavigate();
  const clientData = useClientData();
  return (
    <div className="flex flex-col justify-center items-center h-full  filter drop-shadow-lg space-y-8">
      <h1 className="text-6xl text-white font-bold">
        Waiting for Flight to Start...
      </h1>
      <FaSpinner className="animate-spin-step text-4xl text-white" />
      <div className="flex items-center gap-4">
        <h2 className="text-4xl text-white font-bold">My Client Name:</h2>
        <button
          className="btn btn-primary"
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
        </button>
      </div>
      <Button
        className="btn btn-primary btn-lg"
        onClick={async e => {
          const result = await prompt({
            header: "",
            body: "What is the password?",
            inputProps: {type: "password"},
          });
          if (result) {
            navigate("/config");
          }
        }}
      >
        Go to Config
      </Button>
    </div>
  );
}
