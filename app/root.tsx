import { UNSAFE_PortalProvider } from "@react-aria/overlays";
import { useQueries } from "@tanstack/react-query";
import { NoMatch } from "@thorium/components/NotFound";
import AppContext, { clientId, liveQueryClient, q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { getBackground } from "@thorium/utils/getBackground";

import "./styles/tailwind.css";
// @ts-expect-error
import "@fontsource-variable/outfit";
import { useRef } from "react";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	type MetaFunction,
} from "react-router";
import { ClientOnly } from "remix-utils/client-only";

import type { Route } from "./+types/root";
import icon from "./images/logo.svg?url";

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
			className="fixed inset-0 -z-10 bg-cover bg-center"
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
					<div className="absolute top-0 z-0 h-full w-full text-white">{children}</div>
				</UNSAFE_PortalProvider>
				<div ref={container} />
				<Snapshot />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

function Preload() {
	const preloadOptions = {
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		staleTime: Number.POSITIVE_INFINITY,
		queryFn: ({ signal, queryKey: [pathKey, input] }: { signal: any; queryKey: any }) => {
			const path = pathKey.join(".");
			return liveQueryClient.netRequest({ path, ...input, signal });
		},
	};
	useQueries({
		queries: [
			{
				queryKey: q.ship.players.getQueryKey(),
				...preloadOptions,
			},
			{ queryKey: q.ship.player.getQueryKey({ clientId }), ...preloadOptions },
			{ queryKey: q.ship.get.getQueryKey({ clientId }), ...preloadOptions },
			{ queryKey: q.station.get.getQueryKey({ clientId }), ...preloadOptions },
			{ queryKey: q.client.get.getQueryKey({ clientId }), ...preloadOptions },
			{ queryKey: q.flight.active.getQueryKey(), ...preloadOptions },
		],
	});

	return null;
}

export default function Root() {
	return (
		<AppContext>
			<Preload />
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
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
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
			className="btn-circle btn-sm bg-neutral/20 fixed bottom-2 left-2 z-50 backdrop-blur"
			onClick={() => {
				q.server.snapshot.netSend();
			}}
		>
			<Icon name="camera" size="md" className="text-white" />
		</Button>
	);
}
