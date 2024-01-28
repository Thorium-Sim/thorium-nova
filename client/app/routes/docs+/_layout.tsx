import * as React from "react";
import {renderToString} from "react-dom/server";
import {NavLink, useLocation, Outlet} from "@remix-run/react";
import Menubar from "@thorium/ui/Menubar";
import {Disclosure} from "@headlessui/react";
import "./docs.css";
import {parseDocument} from "htmlparser2";
import render from "dom-serializer";
import {Icon} from "@thorium/ui/Icon";
import {Navigate} from "@client/components/Navigate";

const ROUTES = import.meta.glob("./**/*.{md,mdx}", {
  eager: true,
});

type RouteType = {
  section: string;
  path: string;
  frontmatter: {
    title: string;
    order: number;
  };
  toc: {level: HeadingLevel; content: string}[];
};
function isRoute(route: any): route is RouteType {
  if (!route) return false;
  return route.path;
}

function isRouteModule(
  route: unknown
): route is {html: string; attributes: any; toc: any} {
  if (typeof route !== "object") return false;
  if (!route) return false;
  if (!("default" in route)) return false;
  return true;
}

function stripHtml(html: string) {
  let tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

export const routes = Object.keys(ROUTES)
  .map(route => {
    const routeObj = ROUTES[route] as {
      frontmatter: {title: string; order: number};
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

    // Figure out the TOC
    const html = renderToString(<routeObj.default />);
    const root: any = parseDocument(html);
    function searchChildren(node: any): any[] {
      let output: Element[] = [];
      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.name)) {
        output.push(node);
      }
      node.children?.forEach((node: any) => {
        output = output.concat(searchChildren(node as any));
      });
      return output;
    }

    const toc: {level: HeadingLevel; content: string}[] = searchChildren(
      root
    ).map(index => ({
      level: index.tagName.replace("h", "") as HeadingLevel,
      content: typeof window === "undefined" ? "" : stripHtml(render(index)),
    }));
    return {
      path: path,
      section: routeParts[0],
      frontmatter: routeObj.frontmatter,
      toc,
    };
  })
  .filter(isRoute);

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
}: Heading & {scrollToHeading: (id: string) => void}) => {
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
        onClick={e => {
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
  toc: {level: HeadingLevel; content: string}[];
}) {
  return (
    <div className="toc">
      <h2 className="font-bold text-3xl mb-4">Table of Contents</h2>
      <ul className="ml-2">
        {toc.map(child => (
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
    }, {})
  );
  const docRef = React.useRef<HTMLDivElement>(null);
  const scrollToHeading = React.useCallback(
    (id: string) => {
      if (!docRef.current) return;
      docRef.current.querySelector(`#${id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [docRef]
  );
  const location = useLocation();

  const toc = routes.find(r => location.pathname.endsWith(r.path))?.toc || [];
  return (
    <div className="docs h-full">
      {location.pathname === "/docs" ? (
        <Navigate to={"/docs/Quick%20Start/Getting%20Started"} replace />
      ) : null}
      <Menubar>
        <div className="flex justify-around gap-4 h-[calc(100%-2rem)]">
          <aside className="px-4 py-8 text-white w-full max-w-sm bg-black/60 backdrop-filter backdrop-blur">
            {orderedRoutes.map(([section, route]) => (
              <Disclosure key={section}>
                {({open}) => (
                  <>
                    <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-xl font-medium text-left text-purple-300 hover:text-purple-400 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                      <span>{section}</span>
                      <Icon
                        name="chevron-up"
                        className={`${
                          open ? "transform rotate-180" : ""
                        } w-5 h-5 text-purple-300`}
                      />
                    </Disclosure.Button>
                    <Disclosure.Panel className="px-4 text-lg">
                      <ul className="ml-4">
                        {route
                          .concat()
                          .sort((a, b) => {
                            if (!a.frontmatter) return -1;
                            if (!b.frontmatter) return 1;
                            if (a.frontmatter.order < b.frontmatter.order)
                              return -1;
                            if (a.frontmatter.order > b.frontmatter.order)
                              return 1;
                            return 0;
                          })
                          .map(
                            route =>
                              route.frontmatter && (
                                <li
                                  key={route.path}
                                  className="hover:text-gray-200 text-gray-400"
                                >
                                  <NavLink
                                    to={`/docs/${route.path}`}
                                    className={({isActive}) =>
                                      isActive ? "font-semibold text-white" : ""
                                    }
                                  >
                                    {route.frontmatter.title}
                                  </NavLink>
                                </li>
                              )
                          )}
                      </ul>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            ))}
          </aside>
          <article className="overflow-y-auto flex-1" key={location.pathname}>
            <div
              className="mx-auto max-w-screen-lg my-16 bg-black/80 p-8 rounded-lg backdrop-filter backdrop-blur"
              ref={docRef}
            >
              <div className="prose prose-lg mx-auto">
                <Outlet />
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
