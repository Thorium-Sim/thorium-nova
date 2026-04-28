import { ClientButton } from "@thorium/components/ClientButton";
import Logo from "@thorium/images/logo.svg?url";
import { Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link } from "react-router";

import packageJson from "../../../package.json" with { type: "json" };
import { IPAddress } from "./IPAddress";

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
			<div className="flex items-end self-start">
				<img draggable={false} src={Logo} alt="Thorium Logo" className="max-h-32" />
				<h1 className="ml-3 min-w-[12ch] text-4xl text-white">Thorium Nova</h1>
			</div>
			<h2 className="mt-2 text-2xl">
				{updateText ? (
					updateText
				) : (
					<Link className="text-purple-300 hover:text-purple-500" to="/releases">
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
		</div>
	);
};
