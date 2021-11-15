import {matchSorter} from "match-sorter";
import {Fragment} from "react";
import {useMemo, useState} from "react";

const capitalCase = (str: string) => {
  return str[0].toUpperCase() + str.slice(1);
};

type OnlyString<T> = T extends string ? T : never;

interface SearchableListProps<
  ID extends string | number = string,
  L extends ListItem<ID> = ListItem<ID>
> {
  items: L[];
  selectedItem?: ID | null;
  setSelectedItem?: (item: ID) => void;
  renderItem?: (item: L) => JSX.Element;
  searchKeys?: OnlyString<keyof L>[];
}
interface ListItem<ID extends string | number = string> {
  id: ID;
  [key: string]: any;
}
function SearchableList<
  ID extends string | number,
  Item extends ListItem<ID> = {id: ID; label: string; category: string}
>({
  items,
  selectedItem,
  setSelectedItem,
  renderItem,
  searchKeys = ["label", "category"] as OnlyString<keyof Item>[],
}: SearchableListProps<ID, Item>) {
  const [search, setSearch] = useState<string>("");
  const filteredObjects = useMemo(
    () => matchSorter(items, search, {keys: searchKeys}),
    [items, search, searchKeys]
  );
  const sortedIntoCategories = filteredObjects.reduce(
    (prev: {[key: string]: Item[]}, next: Item) => {
      const cat = next.category || "";
      prev[cat] = prev[cat] || [];
      prev[cat].push(next);
      return prev;
    },
    {}
  );
  return (
    <>
      <div className="form-control">
        <label className="label">Search</label>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          className="input"
          placeholder="Search..."
        ></input>
      </div>
      <ul className="flex-1 overflow-y-auto select-none">
        {Object.entries(sortedIntoCategories)
          .concat()
          .sort(([a], [b]) => {
            if (a > b) return 1;
            if (b > a) return -1;
            return 0;
          })
          .map(([key, items]) => (
            <Fragment key={key}>
              {key && (
                <li className="list-group-item list-group-item-small disabled">
                  {capitalCase(key)}
                </li>
              )}
              {items.map(c => {
                return (
                  <li
                    key={c.id}
                    className={`list-group-item ${
                      c.id === selectedItem ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedItem?.(c.id);
                    }}
                  >
                    {renderItem ? renderItem(c) : c.label}
                  </li>
                );
              })}
            </Fragment>
          ))}
      </ul>
    </>
  );
}

export default SearchableList;
