import userEvent from "@testing-library/user-event";
import React from "react";
import uploadAsset from "server/helpers/uploadAsset";
import {fireEvent, render} from "test-utils";
import PluginForm from "../PluginForm";

describe("PluginForm", () => {
  it("should render", async () => {
    const setName = jest.fn();
    const setDescription = jest.fn();
    const setTags = jest.fn();
    const setCoverImage = jest.fn();
    const {findByLabelText, findByText, findByPlaceholderText} = render(
      <PluginForm
        plugin={{
          id: "test",
          name: "Test Plugin",
          description: "This is a test plugin",
          tags: ["Test Tag"],
          coverImage: "",
        }}
        setName={setName}
        setDescription={setDescription}
        setTags={setTags}
        setCoverImage={setCoverImage}
      />
    );
    const nameField = (await findByLabelText("Name")) as HTMLInputElement;
    expect(nameField).toBeInTheDocument();
    expect(nameField.value).toEqual("Test Plugin");
    userEvent.clear(nameField);
    fireEvent.blur(nameField);
    expect(await findByText("Name is required")).toBeInTheDocument();

    userEvent.type(nameField, "New Name");
    expect(nameField.value).toEqual("New Name");
    fireEvent.blur(nameField);
    expect(setName).toHaveBeenCalled();

    const descriptionField = (await findByLabelText(
      "Description"
    )) as HTMLInputElement;
    expect(descriptionField).toBeInTheDocument();
    expect(descriptionField.value).toEqual("This is a test plugin");
    userEvent.clear(descriptionField);
    userEvent.type(descriptionField, "New Description");
    expect(descriptionField.value).toEqual("New Description");
    fireEvent.blur(descriptionField);
    expect(setDescription).toHaveBeenCalled();

    const tagsField = (await findByPlaceholderText(
      "Type and press return to add a tag"
    )) as HTMLInputElement;
    expect(tagsField).toBeInTheDocument();
    expect(await findByText("Test Tag")).toBeInTheDocument();
    userEvent.type(tagsField, "This is a test\n");
    fireEvent.blur(tagsField);
    expect(tagsField.value).toEqual("");
    expect(setTags).toHaveBeenCalledTimes(1);
    userEvent.type(tagsField, "{backspace}");
    expect(setTags).toHaveBeenCalledTimes(2);
    userEvent.type(tagsField, "Test Tag");
    fireEvent.blur(tagsField);
    expect(setTags).toHaveBeenCalledTimes(2);

    const fileLabel = await findByLabelText("Click or Drop files here");
    const file = new File(["hello"], "hello.png", {type: "image/png"});
    expect(setCoverImage).not.toHaveBeenCalled();
    userEvent.upload(fileLabel, file);
    expect(setCoverImage).toHaveBeenCalled();
  });
  it("should render an image for the cover photo", async () => {
    const setName = jest.fn();
    const setDescription = jest.fn();
    const setTags = jest.fn();
    const setCoverImage = jest.fn();
    const {findByAltText} = render(
      <PluginForm
        plugin={{
          id: "test",
          name: "Test Plugin",
          description: "This is a test plugin",
          tags: ["Test Tag"],
          coverImage: "myImage.png",
        }}
        setName={setName}
        setDescription={setDescription}
        setTags={setTags}
        setCoverImage={setCoverImage}
      />
    );
    expect(await findByAltText("Cover Image")).toBeInTheDocument();
  });
  it("should properly handle no plugin", async () => {
    const setName = jest.fn();
    const setDescription = jest.fn();
    const setTags = jest.fn();
    const setCoverImage = jest.fn();
    const {findByLabelText, findByText, findByPlaceholderText} = render(
      <PluginForm
        setName={setName}
        setDescription={setDescription}
        setTags={setTags}
        setCoverImage={setCoverImage}
      />
    );

    const nameField = (await findByLabelText("Name")) as HTMLInputElement;
    expect(nameField).toBeInTheDocument();
    userEvent.type(nameField, "New Name");
    fireEvent.blur(nameField);
    expect(setName).not.toHaveBeenCalled();

    const descriptionField = (await findByLabelText(
      "Description"
    )) as HTMLInputElement;
    userEvent.type(descriptionField, "New Description");
    fireEvent.blur(descriptionField);
    expect(setDescription).not.toHaveBeenCalled();

    expect(descriptionField).toBeInTheDocument();
    const tagsField = (await findByPlaceholderText(
      "Type and press return to add a tag"
    )) as HTMLInputElement;
    userEvent.type(tagsField, "This is a test\n");
    fireEvent.blur(tagsField);
    expect(setTags).not.toHaveBeenCalled();

    const fileLabel = await findByLabelText("Click or Drop files here");
    const file = new File(["hello"], "hello.png", {type: "image/png"});
    userEvent.upload(fileLabel, file);
    expect(setCoverImage).not.toHaveBeenCalled();
  });
});
