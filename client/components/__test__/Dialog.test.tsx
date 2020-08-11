import userEvent from "@testing-library/user-event";
import React from "react";
import {render} from "test-utils";
import Dialog, {useAlert, useConfirm, usePrompt} from "../Dialog";

const DialogTester: React.FC<{
  onPrompt?: (t: string) => void;
  onConfirm?: (t: boolean) => void;
}> = ({onPrompt, onConfirm}) => {
  const prompt = usePrompt();
  const confirm = useConfirm();
  const alert = useAlert();

  return (
    <div>
      <button
        onClick={async () => {
          const value = await prompt({
            header: "Prompt Header",
            body: "Prompt Body",
            defaultValue: "Testing",
          });
          if (typeof value === "string") {
            onPrompt?.(value);
          }
        }}
      >
        Prompt
      </button>
      <button
        onClick={async () => {
          const value = await confirm({
            header: "Confirm Header",
            body: "Confirm Body",
          });
          onConfirm?.(!!value);
        }}
      >
        Confirm
      </button>
      <button
        onClick={async () => {
          await alert({header: "Alert Header", body: "Alert Body"});
        }}
      >
        Alert
      </button>
    </div>
  );
};

describe("Dialog", () => {
  it("should render an alert", async () => {
    const {findByText} = render(
      <Dialog>
        <DialogTester />
      </Dialog>
    );
    const alertButton = await findByText("Alert");
    userEvent.click(alertButton);
    await findByText("Alert Header");
    expect(await findByText("Alert Body")).toBeInTheDocument();
    userEvent.click(await findByText("OK"));
  });
  it("should render confirm", async () => {
    const onConfirm = jest.fn();
    const {findByText} = render(
      <Dialog>
        <DialogTester onConfirm={onConfirm} />
      </Dialog>
    );
    const alertButton = await findByText("Confirm");
    userEvent.click(alertButton);
    await findByText("Confirm Header");
    expect(await findByText("Confirm Body")).toBeInTheDocument();
    expect(await findByText("Cancel")).toBeInTheDocument();
    userEvent.click(await findByText("OK"));
  });
  it.skip("should render prompt", async () => {
    const onPrompt = jest.fn();
    const {findByText, findByLabelText} = render(
      <Dialog>
        <DialogTester onPrompt={onPrompt} />
      </Dialog>
    );
    const alertButton = await findByText("Prompt");
    userEvent.click(alertButton);
    const promptHeader = await findByText("Prompt Header");
    expect(await findByText("Cancel")).toBeInTheDocument();
    const input = await findByLabelText("Response");
    userEvent.clear(input);
    userEvent.type(input, "Hey there!");
    userEvent.click(await findByText("OK"));
  });
});
