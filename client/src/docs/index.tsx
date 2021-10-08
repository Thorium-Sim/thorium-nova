import * as React from "react";
import {NavLink, Outlet} from "react-router-dom";
import "prismjs/themes/prism-tomorrow.css";
import Menubar from "@thorium/ui/Menubar";

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

export const DocLayout = () => {
  const orderedRoutes = Object.entries(
    routes.reduce((acc: Record<string, Route[]>, route) => {
      if (!acc[route.section]) {
        acc[route.section] = [];
      }
      acc[route.section].push(route);
      return acc;
    }, {})
  );
  return (
    <div className="docs h-full">
      <Menubar></Menubar>
      <div className="flex justify-around gap-4 h-full">
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
                    .map(route => (
                      <li key={route.path}>
                        <NavLink
                          to={route.path}
                          className={({isActive}) =>
                            isActive ? "font-semibold" : ""
                          }
                        >
                          {route.frontmatter.title}
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </aside>
        <article className="overflow-y-auto flex-1">
          <div className="prose prose-lg mx-auto max-w-screen-lg my-16 bg-black/80 p-8 rounded-lg backdrop-filter backdrop-blur">
            <Outlet />
          </div>
        </article>
      </div>
    </div>
  );
};
