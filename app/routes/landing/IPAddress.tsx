import { CopyToClipboard } from "@thorium/ui/CopyToClipboard";
import { useState, useEffect } from "react";

function useConnectionAddress() {
	const [connectionAddress, setConnectionAddress] = useState("");

	useEffect(() => {
		window?.thorium?.getAddress().then(setConnectionAddress);
	}, []);
	return connectionAddress;
}
export function IPAddress() {
	const connectionAddress = useConnectionAddress();

	return connectionAddress ? (
		<h3 className="font-semi-bold mt-2 text-xl">
			Connect: <CopyToClipboard text={connectionAddress}>{connectionAddress}</CopyToClipboard>
		</h3>
	) : null;
}
