import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	type MetaFunction,
} from "react-router";
import { Icon, href as iconsHref } from "@thorium/ui/Icon";
import { UNSAFE_PortalProvider } from "@react-aria/overlays";
import { getBackground } from "@thorium/utils/getBackground";
import Button from "@thorium/ui/Button";
import { ClientOnly } from "remix-utils/client-only";
import { NoMatch } from "@thorium/components/NotFound";
import "./styles/tailwind.css";
import "@fontsource-variable/outfit";
import icon from "./images/logo.svg?url";
import type { Route } from ".react-router/types/app/+types/root";
import AppContext, { q } from "@thorium/context/AppContext";
import { useRef } from "react";

export const meta: MetaFunction = () => {
	return [{ title: "Thorium Nova" }, {}];
};

export const links: Route.LinksFunction = () => {
	return [{ rel: "icon", href: icon }];
};

function Background() {
	const bg = getBackground();
	return (
		<div
			className="fixed inset-0 -z-10 bg-center bg-cover"
			style={{
				backgroundImage: `linear-gradient(
135deg,
rgba(0, 0, 0, 1) 0%,
rgba(0, 0, 0, 0) 40%,
rgba(0, 0, 0, 0) 60%,
rgba(0, 0, 0, 1) 100%
),
url(${bg})`,
			}}
		/>
	);
}

export function Layout({ children }: { children: React.ReactNode }) {
	const container = useRef<HTMLDivElement>(null);
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<ClientOnly>{() => <Background />}</ClientOnly>
				<UNSAFE_PortalProvider getContainer={() => container.current}>
					<div className="z-0 absolute top-0  w-full h-full text-white">
						{children}
					</div>
				</UNSAFE_PortalProvider>
				<div ref={container} />
				<Snapshot />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function Root() {
	return (
		<AppContext>
			<Outlet />
		</AppContext>
	);
}

export function ErrorBoundary({ error }: { error: Error }) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		if (error.status === 404) {
			return <NoMatch />;
		}
		message = "Error";
		details = error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}

function Snapshot() {
	if (process.env.NODE_ENV === "production") return null;
	return (
		<Button
			className="btn-circle btn-sm fixed bottom-2 left-2 w-11 h-11 btn-ghost z-50 "
			onClick={() => {
				q.server.snapshot.netSend();
			}}
		>
			<Icon name="camera" size="xl" className="text-white" />
		</Button>
	);
}
