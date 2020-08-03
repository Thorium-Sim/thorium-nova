import userEvent from "@testing-library/user-event";
import React from "react";
import {render} from "test-utils";
import UploadWell from "../uploadWell";

describe("upload well", () => {
  it("should handle files being added", async () => {
    const change = jest.fn();
    const {findByLabelText} = render(<UploadWell onChange={change} />);
    const fileLabel = await findByLabelText("Click or Drop files here");
    expect(fileLabel).toBeInTheDocument();
    const file = new File(["hello"], "hello.png", {type: "image/png"});

    userEvent.upload(fileLabel, file);

    expect(change).toHaveBeenCalled();
  });
});
