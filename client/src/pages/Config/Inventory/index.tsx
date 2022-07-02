import {Routes, Route} from "react-router-dom";
import {InventoryList} from "./InventoryList";
import {InventoryLayout} from "./InventoryLayout";

export default function InventoryConfig() {
  return (
    <Routes>
      <Route path="/" element={<InventoryList />}>
        <Route path=":inventoryId" element={<InventoryLayout />}></Route>
      </Route>
    </Routes>
  );
}
