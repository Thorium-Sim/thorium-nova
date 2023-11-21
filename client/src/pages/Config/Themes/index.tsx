import {Suspense} from "react";
import {Route, Routes} from "react-router-dom";
import {ThemeLayout} from "./ThemeLayout";
import {ThemeList} from "./ThemeList";
import NoMatch from "@client/pages/NotFound";

export default function Themes() {
  return (
    <Routes>
      <Route path="/" element={<ThemeList />}>
        <Route
          path=":themeId"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <ThemeLayout />
            </Suspense>
          }
        ></Route>
      </Route>
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
}
