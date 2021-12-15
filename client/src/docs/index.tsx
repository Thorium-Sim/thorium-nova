import * as React from "react";
import {Link, NavLink, Route, Routes, useLocation} from "react-router-dom";
import "prismjs/themes/prism-tomorrow.css";
import Menubar from "@thorium/ui/Menubar";
import {Disclosure, Popover, Transition} from "@headlessui/react";
import {Index} from "flexsearch";
import "./docs.css";
import {FaChevronUp} from "react-icons/fa";

const docIndex = new Index();

function Search() {
  const [results, setResults] = React.useState<{title: string; path: string}[]>(
    []
  );
  return (
    <div className="search mb-4">
      <Popover className="relative">
        <>
          <input
            type="text"
            placeholder="Search"
            className="input input-lg input-bordered input-ghost w-full !h-8 py-0 focus:!text-white"
            onFocus={e => {
              const value = e.target.value;
              if (value.length > 2) {
                const results = docIndex
                  .search(value)
                  .map(id => (typeof id === "string" ? JSON.parse(id) : id));
                setResults(results);
              }
            }}
            onChange={e => {
              const value = e.target.value;
              if (value.length > 2) {
                const results = docIndex
                  .search(value)
                  .map(id => (typeof id === "string" ? JSON.parse(id) : id));
                setResults(results);
              } else {
                setResults([]);
              }
            }}
          />
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
            show={results.length > 0}
          >
            <Popover.Panel
              static
              className="absolute z-10 w-64 px-4 mt-3 transform -translate-x-1/2 left-1/2 sm:px-0 lg:max-w-3xl"
            >
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="relative bg-black/70 backdrop-filter backdrop-blur-xl p-4 text-2xl">
                  {results.map(item => (
                    <Link
                      onClick={() => {
                        setResults([]);
                      }}
                      key={item.path}
                      to={`/docs/${item.path}`}
                      className="flex items-center px-2 py-1 m-1 transition duration-150 ease-in-out rounded-lg hover:bg-gray-800 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                    >
                      <p className="font-medium text-gray-50">{item.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      </Popover>
    </div>
  );
}

const ROUTES = import.meta.globEager("/src/docs/**/*.{tsx,jsx,md,mdx}");

type RouteType = {
  path: string;
  component: React.ComponentType;
  content: string;
  section: string;
  frontmatter: {
    title: string;
    order: number;
  };
};
function isRoute(route: any): route is RouteType {
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
    if (routeParts.length <= 1) return null;
    return {
      path: path.toLowerCase().replace(/\s/g, "-"),
      component: ROUTES[route].default,
      content: ROUTES[route].content,
      section: routeParts[0],
      frontmatter: ROUTES[route].frontmatter,
    };
  })
  .filter(isRoute);

routes.forEach(route => {
  docIndex.add(
    JSON.stringify({...route.frontmatter, path: route.path}),
    route.content
  );
});
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
    routes.reduce((acc: Record<string, RouteType[]>, route) => {
      if (!acc[route.section]) {
        acc[route.section] = [];
      }
      acc[route.section].push(route);
      return acc;
    }, {})
  );
  console.log(orderedRoutes);
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
          {orderedRoutes.map(([section, route]) => (
            <Disclosure key={section}>
              {({open}) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-2xl font-medium text-left text-purple-300 hover:text-purple-400 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                    <span>{section}</span>
                    <FaChevronUp
                      className={`${
                        open ? "transform rotate-180" : ""
                      } w-5 h-5 text-purple-300`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 text-xl">
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
              <Routes>
                {routes.map(({path, component: Component = React.Fragment}) => (
                  <Route key={path} path={path} element={<Component />} />
                ))}
              </Routes>
            </div>
          </div>
        </article>
        <aside className="flex-1 overflow-y-auto px-4 py-8 text-white w-full max-w-sm bg-black/60 backdrop-filter backdrop-blur">
          <Search />
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
