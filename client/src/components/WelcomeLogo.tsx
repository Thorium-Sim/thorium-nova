import {Link} from "react-router-dom";
import Logo from "../images/logo.svg?url";
import packageJson from "../../../package.json";
import {ClientButton} from "./ClientButton";
import {useEffect, useState} from "react";
import {useClientData} from "../context/useCardData";
import Button from "@thorium/ui/Button";
import {netSend} from "../context/netSend";

function useConnectionAddress() {
  const [connectionAddress, setConnectionAddress] = useState("");

  useEffect(() => {
    window?.thorium?.getAddress().then(setConnectionAddress);
  }, []);
  return connectionAddress;
}
export const WelcomeLogo = ({className}: {className?: string}) => {
  const connectionAddress = useConnectionAddress();
  const clientData = useClientData();

  return (
    <div className={className}>
      <div className="flex items-end self-start ">
        <img
          draggable={false}
          src={Logo}
          alt="Thorium Logo"
          className="max-h-32"
        />
        <h1 className="text-4xl ml-3 min-w-[12ch] text-white">Thorium Nova</h1>
      </div>
      <h2 className="text-2xl mt-2">
        <Link className="text-purple-300 hover:text-purple-500" to="/releases">
          Version {packageJson.version}
        </Link>
      </h2>
      <div className="mt-6"></div>
      <ClientButton />
      {connectionAddress && (
        <h3 className="text-xl font-semi-bold mt-2">
          Connect: {connectionAddress}
        </h3>
      )}
      {clientData.thorium.hasHost ? null : (
        <Button
          className="btn-warning btn-sm"
          onClick={() => netSend("clientClaimHost")}
        >
          Claim Host
        </Button>
      )}
    </div>
  );
};
