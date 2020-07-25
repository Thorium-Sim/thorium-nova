import React from "react";
import {render} from "test-utils";
import TestFile from "./TestFile";

test("it works", () => {
  const {debug, container} = render(<TestFile />);
});
