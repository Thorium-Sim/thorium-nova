import {Suspense} from "react";
import {Route, Routes} from "react-router-dom";
import {ThemeLayout} from "./ThemeLayout";
import {ThemeList} from "./ThemeList";

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
    </Routes>
  );
}
