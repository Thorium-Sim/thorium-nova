import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
	isRouteErrorResponse,
} from "@remix-run/react";
import "@fontsource/outfit";
import "./styles/tailwind.css";
import "./styles/theme.css";
import AppContext, { q } from "./context/AppContext";
import icon from "./images/logo.svg?url";
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { Icon, href as iconsHref } from "@thorium/ui/Icon";
import type { ReactNode } from "react";
import { getBackground } from "./utils/getBackground";
import { ClientOnly } from "remix-utils/client-only";
import NoMatch from "./components/NotFound/index.client";
import Button from "@thorium/ui/Button";

export const meta: MetaFunction = () => {
	return [{ title: "Thorium Nova" }];
};

export const links: LinksFunction = () => {
	return [{ rel: "preload", href: iconsHref, as: "image" }];
};

export function clientLoader() {
	const bg = getBackground();
	return { bg };
}

clientLoader.hydrate = true;

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
function ConfigLayoutWrapper({ children }: { children: ReactNode }) {
	return (
		<>
			<ClientOnly>{() => <Background />}</ClientOnly>
			<div className="z-0 absolute top-0  w-full h-full text-white">
				{children}
			</div>
		</>
	);
}

function Document({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" type="image/svg+xml" href={icon} />
				<Meta />
				<Links />
			</head>
			<body>
				{children}

				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
export default function App() {
	return (
		<Document>
			<ConfigLayoutWrapper>
				<AppContext>
					<Outlet />
					<Snapshot />
				</AppContext>
			</ConfigLayoutWrapper>
		</Document>
	);
}

export const HydrateFallback = App;

export function ErrorBoundary() {
	const error = useRouteError();
	if (isRouteErrorResponse(error)) {
		return (
			<Document>
				<ClientOnly>
					{() => (
						<ConfigLayoutWrapper>
							<NoMatch />
						</ConfigLayoutWrapper>
					)}
				</ClientOnly>
			</Document>
		);
	}
	return (
		<Document>
			<div className="p-4 text-white">
				<h1 className="text-5xl">Error</h1>
				<pre className="whitespace-pre-wrap">
					{error instanceof Error ? error.message : JSON.stringify(error)}
				</pre>
			</div>
		</Document>
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
