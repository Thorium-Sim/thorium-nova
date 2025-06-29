import { Link } from "react-router";
import Logo from "@thorium/images/logo.svg?url";
import packageJson from "../../../package.json";
import { ClientButton } from "@thorium/components/ClientButton";
import { Suspense, useEffect, useState } from "react";
import Button from "@thorium/ui/Button";
import { clientId, q } from "@thorium/context/AppContext";
import { IPAddress } from "./IPAddress";
import { ErrorBoundary } from "react-error-boundary";

export const WelcomeLogo = ({ className }: { className?: string }) => {
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
			<ErrorBoundary fallback={null}>
				<Suspense>
					<ClientButton />
				</Suspense>
			</ErrorBoundary>
			<IPAddress />
			<ErrorBoundary fallback={null}>
				<Suspense>
					<HostButton />
				</Suspense>
			</ErrorBoundary>
		</div>
	);
};

export function HostButton() {
	const [hasHost] = q.thorium.hasHost.useNetRequest();

	return hasHost ? null : (
		<Button
			className="btn-warning btn-sm"
			onClick={() => q.thorium.claimHost.netSend({ clientId })}
		>
			Claim Host
		</Button>
	);
}
