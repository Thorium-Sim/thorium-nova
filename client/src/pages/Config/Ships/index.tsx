import {Route, Routes} from "react-router-dom";
import {Suspense} from "react";
import {Physics} from "./Physics";
import {Systems} from "./Systems";
import {Assets} from "./Assets";
import {Basic} from "./Basic";
import {ShipList} from "./ShipList";
import {ShipLayout} from "./ShipLayout";

export default function ShipsRoute() {
  return (
    <Routes>
      <Route path="/" element={<ShipList />}>
        <Route
          path=":shipId"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <ShipLayout />
            </Suspense>
          }
        >
          <Route path="basic" element={<Basic />} />
          <Route path="assets" element={<Assets />} />
          <Route path="physics" element={<Physics />} />
          <Route path="systems" element={<Systems />} />
        </Route>
      </Route>
    </Routes>
  );
}
