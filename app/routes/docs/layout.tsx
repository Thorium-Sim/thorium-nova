import * as React from "react";
import { NavLink, useLocation, Outlet } from "react-router";
import Menubar from "@thorium/ui/Menubar";
import "./docs.css";
import { Navigate } from "@thorium/components/Navigate";

const ROUTES = import.meta.glob("./**/*.{md,mdx}", {
	eager: true,
});

type RouteType = {
	route: string;
	section: string;
	path: string;
	frontmatter: {
		title: string;
		order: number;
	};
	Doc: React.ComponentType;
};
function isRoute(route: any): route is RouteType {
	if (!route) return false;
	return route.path;
}

function isRouteModule(
	route: unknown,
): route is { html: string; attributes: any; toc: any } {
	if (typeof route !== "object") return false;
	if (!route) return false;
	if (!("default" in route)) return false;
	return true;
}

function stripHtml(html: string) {
	const tmp = document.createElement("DIV");
	tmp.innerHTML = html;
	return tmp.textContent || tmp.innerText || "";
}

export const routes = Object.keys(ROUTES)
	.map((route) => {
		const routeObj = ROUTES[route] as {
			frontmatter: { title: string; order: number };
			default: React.ComponentType;
		};
		if (!isRouteModule(routeObj)) return null;
		const path = route
			.replace(/\/src\/docs|index|\.(tsx|jsx|md|mdx)$/g, "")
			.replace(/^\/(.*)$/g, "$1")
			.replace(/\[\.{3}.+\]/, "*")
			.replace(/\[(.+)\]/, ":$1")
			.replace(/\+\//, "/")
			.replace(/^\.\//, "");
		if (!routeObj.default) return null;
		const routeParts = path.split("/");
		if (routeParts.length <= 1) return null;

		return {
			route,
			path: path,
			section: routeParts[0],
			frontmatter: routeObj.frontmatter,
			Doc: routeObj.default,
		};
	})
	.filter(isRoute);

function generateTOC(element: HTMLElement) {
	function searchChildren(node: HTMLElement): HTMLElement[] {
		let output: HTMLElement[] = [];
		if (["H1", "H2", "H3", "H4", "H5", "H6"].includes(node.nodeName)) {
			output.push(node);
		}

		Array.from(node.children)?.forEach((node: any) => {
			output = output.concat(searchChildren(node as any));
		});
		return output;
	}

	const toc: { level: HeadingLevel; content: string }[] = searchChildren(
		element,
	).map((index) => ({
		level: index.tagName.replace("h", "") as HeadingLevel,
		content: index.innerText,
	}));
	return toc;
}
type HeadingLevel = "1" | "2" | "3" | "4" | "5" | "6";
type Heading = {
	title: string;
	id: string;
	level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};
const TOCItem = ({
	title,
	id,
	level,
	scrollToHeading,
}: Heading & { scrollToHeading: (id: string) => void }) => {
	if (level === "h1") return null;
	return (
		<li>
			<a
				href={`#${id}`}
				className={`mb-2 text-purple-200 hover:text-purple-400 block ${
					level === "h2"
						? "text-2xl"
						: level === "h3"
							? "text-xl"
							: level === "h4"
								? "text-lg"
								: "text-base"
				}`}
				onClick={(e) => {
					e.preventDefault();
					scrollToHeading(id);
				}}
			>
				{title}
			</a>
		</li>
	);
};

function TOC({
	pathname,
	toc,
	scrollToHeading,
}: {
	pathname: string;
	scrollToHeading: (id: string) => void;
	toc: { level: HeadingLevel; content: string }[];
}) {
	return (
		<div className="toc">
			<h2 className="font-bold text-3xl mb-4">Table of Contents</h2>
			<ul className="ml-2">
				{toc.map((child) => (
					<TOCItem
						key={child.content}
						title={child.content}
						id={child.content.toLowerCase().replace(/\s/g, "-")}
						level={`h${child.level}`}
						scrollToHeading={scrollToHeading}
					/>
				))}
			</ul>
		</div>
	);
}

export default function DocLayout() {
	const orderedRoutes = Object.entries(
		routes.reduce((acc: Record<string, RouteType[]>, route) => {
			const section = route?.section;
			if (!section) return acc;
			if (!acc[section]) {
				acc[section] = [];
			}
			acc[section].push(route);
			return acc;
		}, {}),
	);
	const docRef = React.useRef<HTMLDivElement>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies:
	const scrollToHeading = React.useCallback(
		(id: string) => {
			if (!docRef.current) return;
			docRef.current.querySelector(`#${id}`)?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		},
		[docRef],
	);
	const location = useLocation();
	const currentRoute = routes.find((r) =>
		decodeURIComponent(location.pathname).endsWith(r.path),
	);

	const [toc, setToc] = React.useState<
		{ level: HeadingLevel; content: string }[]
	>([]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	React.useEffect(() => {
		if (docRef.current) {
			setToc(generateTOC(docRef.current));
		}
	}, [currentRoute]);
	return (
		<div className="docs h-full">
			{location.pathname === "/docs" ? (
				<Navigate to={"/docs/Quick%20Start/Getting%20Started"} replace />
			) : null}
			<Menubar>
				<div className="flex justify-around gap-4 h-[calc(100%-2rem)]">
					<aside className="px-4 py-8 text-white w-full max-w-sm bg-black/60 backdrop-filter backdrop-blur">
						{orderedRoutes.map(([section, route]) => (
							<React.Fragment key={section}>
								<span>{section}</span>

								<ul className="ml-4">
									{route
										.concat()
										.sort((a, b) => {
											if (!a.frontmatter) return -1;
											if (!b.frontmatter) return 1;
											if (a.frontmatter.order < b.frontmatter.order) return -1;
											if (a.frontmatter.order > b.frontmatter.order) return 1;
											return 0;
										})
										.map(
											(route) =>
												route.frontmatter && (
													<li
														key={route.path}
														className="hover:text-gray-200 text-gray-400"
													>
														<NavLink
															to={`/docs/${route.path}`}
															className={({ isActive }) =>
																isActive ? "font-semibold text-white" : ""
															}
														>
															{route.frontmatter.title}
														</NavLink>
													</li>
												),
										)}
								</ul>
							</React.Fragment>
						))}
					</aside>
					<article className="overflow-y-auto flex-1" key={location.pathname}>
						<div
							className="mx-auto max-w-screen-lg my-16 bg-black/80 p-8 rounded-lg backdrop-filter backdrop-blur"
							ref={docRef}
						>
							<div className="prose prose-lg mx-auto">
								{currentRoute ? <currentRoute.Doc /> : null}
							</div>
						</div>
					</article>
					<aside className="flex-1 overflow-y-auto px-4 py-8 text-white w-full max-w-sm bg-black/60 backdrop-filter backdrop-blur">
						<TOC
							pathname={location.pathname}
							toc={toc}
							scrollToHeading={scrollToHeading}
						/>
					</aside>
				</div>
			</Menubar>
		</div>
	);
}
