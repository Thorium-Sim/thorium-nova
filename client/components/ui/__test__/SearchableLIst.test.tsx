import userEvent from "@testing-library/user-event";
import React from "react";
import {fireEvent, render} from "test-utils";
import SearchableList from "../SearchableList";

describe("SearchableList", () => {
  it("render the list by default", async () => {
    const setSelectedItem = jest.fn();
    const {findByText, findByPlaceholderText} = render(
      <SearchableList
        items={[
          {
            id: "5",
            label: "Rock",
            category: "Mineral",
          },
          {
            id: "3",
            label: "Lettuce",
            category: "Vegetable",
          },
          {
            id: "4",
            label: "Squash",
            category: "Vegetable",
          },
          {
            id: "1",
            label: "Apple",
            category: "Fruit",
          },
          {
            id: "2",
            label: "Banana",
            category: "Fruit",
          },
        ]}
        selectedItem="1"
        setSelectedItem={setSelectedItem}
      ></SearchableList>
    );
    expect(await findByText("Apple")).toBeInTheDocument();
    const banana = await findByText("Banana");
    expect(banana).toBeInTheDocument();
    expect(await findByText("Lettuce")).toBeInTheDocument();
    expect(await findByText("Squash")).toBeInTheDocument();
    expect(await findByText("Fruit")).toBeInTheDocument();
    expect(await findByText("Vegetable")).toBeInTheDocument();
    userEvent.click(await findByText("Squash"));
    expect(setSelectedItem).toHaveBeenCalledWith("4");

    userEvent.type(await findByPlaceholderText("Search"), "PP");
    expect(await findByText("Apple")).toBeInTheDocument();
    expect(banana).not.toBeInTheDocument();
  });
  it("should support a renderItems render prop", async () => {
    const {findByText, findByPlaceholderText} = render(
      <SearchableList
        items={[
          {
            id: "5",
            label: "Rock",
            category: "Mineral",
          },
          {
            id: "3",
            label: "Lettuce",
          },
          {
            id: "4",
            label: "Squash",
            category: "Vegetable",
          },
          {
            id: "1",
            label: "Apple",
            category: "Fruit",
          },
          {
            id: "2",
            label: "Banana",
            category: "Fruit",
          },
        ]}
        renderItem={c => <div key={c.id}>Awesome {c.label}</div>}
      ></SearchableList>
    );
    expect(await findByText("Awesome Apple")).toBeInTheDocument();
  });
});
