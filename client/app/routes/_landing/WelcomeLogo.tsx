import { Link } from "react-router-dom";
import Logo from "@client/images/logo.svg?url";
import packageJson from "@client/../../package.json";
import { ClientButton } from "@client/components/ClientButton";
import { useEffect, useState } from "react";
import Button from "@thorium/ui/Button";
import { CopyToClipboard } from "@thorium/ui/CopyToClipboard";
import { q } from "@client/context/AppContext";

function useConnectionAddress() {
	const [connectionAddress, setConnectionAddress] = useState("");

	useEffect(() => {
		window?.thorium?.getAddress().then(setConnectionAddress);
	}, []);
	return connectionAddress;
}
export const WelcomeLogo = ({ className }: { className?: string }) => {
	const connectionAddress = useConnectionAddress();
	const [hasHost] = q.thorium.hasHost.useNetRequest();
	const [updateText, setUpdateText] = useState("");
	useEffect(() => {
		window.thorium?.registerUpdateHandler((message) => {
			setUpdateText(message);
		});
		return () => {
			window.thorium?.registerUpdateHandler(() => {});
		};
	}, []);
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
				{updateText ? (
					updateText
				) : (
					<Link
						className="text-purple-300 hover:text-purple-500"
						to="/releases"
					>
						Version {packageJson.version}
					</Link>
				)}
			</h2>
			<div className="mt-6" />
			<ClientButton />
			{connectionAddress && (
				<h3 className="text-xl font-semi-bold mt-2">
					Connect:{" "}
					<CopyToClipboard text={connectionAddress}>
						{connectionAddress}
					</CopyToClipboard>
				</h3>
			)}
			{hasHost ? null : (
				<Button
					className="btn-warning btn-sm"
					onClick={() => q.thorium.claimHost.netSend()}
				>
					Claim Host
				</Button>
			)}
		</div>
	);
};
