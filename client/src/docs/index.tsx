import * as React from "react";
import {NavLink, Outlet, Route, Routes, useLocation} from "react-router-dom";
import "prismjs/themes/prism-tomorrow.css";
import Menubar from "@thorium/ui/Menubar";
import "./docs.css";

const ROUTES = import.meta.globEager("/src/docs/**/*.{tsx,jsx,md,mdx}");

type Route = {
  path: string;
  component: React.ComponentType;
  section: string;
  frontmatter: {
    title: string;
    order: number;
  };
};
function isRoute(route: any): route is Route {
  if (!route) return false;
  return route.path && route.component;
}

export const routes = Object.keys(ROUTES)
  .map(route => {
    const path = route
      .replace(/\/src\/docs|index|\.(tsx|jsx|md|mdx)$/g, "")
      .replace(/^\/(.*)$/g, "$1")
      .replace(/\[\.{3}.+\]/, "*")
      .replace(/\[(.+)\]/, ":$1");
    if (!ROUTES[route].default) return null;
    const routeParts = path.split("/");
    return {
      path: path.toLowerCase().replace(/\s/g, "-"),
      component: ROUTES[route].default,
      section: routeParts[0],
      frontmatter: ROUTES[route].frontmatter,
    };
  })
  .filter(isRoute);

type Heading = {
  title: string;
  id: string;
  level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children: Heading[];
  parent: Heading;
};
const TOCItem = ({
  title,
  id,
  level,
  children,
  scrollToHeading,
}: Heading & {scrollToHeading: (id: string) => void}) => (
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
    {children.length > 0 && (
      <ul className="ml-4">
        {children.map(child => (
          <TOCItem
            key={child.id}
            {...child}
            scrollToHeading={scrollToHeading}
          />
        ))}
      </ul>
    )}
  </li>
);
const TOC = function TOC({
  pathname,
  scrollToHeading,
  docRef,
}: {
  pathname: string;
  scrollToHeading: (id: string) => void;
  docRef: React.RefObject<HTMLDivElement>;
}) {
  const [current, setCurrent] = React.useState<Heading | null>(null);
  React.useEffect(() => {
    const parentHeading: Heading = {
      title: "",
      id: "",
      level: "h1",
      children: [],
      parent: null!,
    };
    parentHeading.parent = parentHeading;
    let currentHeading: Heading = parentHeading;
    docRef.current?.querySelectorAll("h2,h3,h4,h5,h6").forEach((h, i) => {
      if (!(h instanceof HTMLHeadingElement)) return;
      const heading: Heading = {
        title: h.innerText,
        id: h.id,
        level: h.tagName.toLowerCase() as
          | "h1"
          | "h2"
          | "h3"
          | "h4"
          | "h5"
          | "h6",
        children: [] as Heading[],
        parent: null!,
      };
      if (currentHeading.level === heading.level) {
        currentHeading.parent.children.push(heading);
        heading.parent = currentHeading.parent;
        currentHeading = heading;
      } else if (currentHeading.level < heading.level) {
        heading.parent = currentHeading;
        currentHeading.children.push(heading);
        currentHeading = heading;
      } else {
        while (currentHeading.level > heading.level) {
          if (!currentHeading.parent) break;
          currentHeading = currentHeading.parent;
        }
        heading.parent = currentHeading.parent;
        heading.parent.children.push(heading);
        currentHeading = heading;
      }
    });
    setCurrent(parentHeading);
  }, [pathname, docRef]);
  if (!current) return null;
  return (
    <div className="toc">
      <h2 className="font-bold text-3xl mb-4">Table of Contents</h2>
      <ul className="ml-2">
        {current.children.map(child => (
          <TOCItem
            key={child.id}
            {...child}
            scrollToHeading={scrollToHeading}
          />
        ))}
      </ul>
    </div>
  );
};
export default function DocLayout() {
  const orderedRoutes = Object.entries(
    routes.reduce((acc: Record<string, Route[]>, route) => {
      if (!acc[route.section]) {
        acc[route.section] = [];
      }
      acc[route.section].push(route);
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

  return (
    <div className="docs h-full">
      <Menubar></Menubar>
      <div className="flex justify-around gap-4 h-[calc(100%-2rem)]">
        <aside className="px-4 py-8 text-white w-full max-w-sm bg-black/60 backdrop-filter backdrop-blur">
          <ul className="ml-2">
            {orderedRoutes.map(([section, route]) => (
              <li key={section}>
                <span className="font-semibold text-2xl">{section}</span>
                <ul className="ml-4">
                  {route
                    .concat()
                    .sort((a, b) => {
                      if (a.frontmatter.order < b.frontmatter.order) return -1;
                      if (a.frontmatter.order > b.frontmatter.order) return 1;
                      return 0;
                    })
                    .map(
                      route =>
                        route.frontmatter && (
                          <li key={route.path}>
                            <NavLink
                              to={`/docs/${route.path}`}
                              className={({isActive}) =>
                                isActive ? "font-semibold" : ""
                              }
                            >
                              {route.frontmatter.title}
                            </NavLink>
                          </li>
                        )
                    )}
                </ul>
              </li>
            ))}
          </ul>
        </aside>
        <article className="overflow-y-auto flex-1">
          <div
            className="prose prose-lg mx-auto max-w-screen-lg my-16 bg-black/80 p-8 rounded-lg backdrop-filter backdrop-blur"
            ref={docRef}
          >
            <Routes>
              {routes.map(({path, component: Component = React.Fragment}) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
            </Routes>
          </div>
        </article>
        <aside className="flex-1 overflow-y-auto px-4 py-8 text-white w-full max-w-sm bg-black/60 backdrop-filter backdrop-blur">
          <TOC
            pathname={location.pathname}
            docRef={docRef}
            scrollToHeading={scrollToHeading}
          />
        </aside>
      </div>
    </div>
  );
}
