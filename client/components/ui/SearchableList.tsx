import React from "react";
import {capitalCase} from "change-case";
import {matchSorter} from "match-sorter";
import {useTranslation} from "react-i18next";
import ListGroupItem from "./ListGroupItem";
import Input from "./Input";

interface SearchableListProps<L extends ListItem = ListItem> {
  items: L[];
  selectedItem?: string | null;
  setSelectedItem?: (item: string) => void;
  renderItem?: (item: L) => JSX.Element;
  searchKeys?: string[];
}
interface ListItem {
  id: string;
  [key: string]: any;
}
const SearchableList: React.FC<SearchableListProps> = ({
  items,
  selectedItem,
  setSelectedItem,
  renderItem,
  searchKeys = ["label", "category"],
}) => {
  const {t} = useTranslation();
  const [search, setSearch] = React.useState<string>("");
  const filteredObjects = React.useMemo(
    () => matchSorter(items, search, {keys: searchKeys}),
    [items, search, searchKeys]
  );
  const sortedIntoCategories = filteredObjects.reduce(
    (prev: {[key: string]: ListItem[]}, next: ListItem) => {
      const cat = next.category || "";
      prev[cat] = prev[cat] || [];
      prev[cat].push(next);
      return prev;
    },
    {}
  );

  return (
    <>
      <Input
        type="search"
        value={search}
        label="Search"
        placeholder={t("Search")}
        onChange={value => setSearch(value)}
      />
      <div className="flex-1 overflow-y-auto select-none">
        {Object.entries(sortedIntoCategories)
          .concat()
          .sort(([a], [b]) => {
            if (a > b) return 1;
            if (b > a) return -1;
            return 0;
          })
          .map(([key, items]) => (
            <React.Fragment key={key}>
              {key && (
                <ListGroupItem size="small" disabled>
                  {capitalCase(key)}
                </ListGroupItem>
              )}
              {items.map(c => (
                <ListGroupItem
                  key={c.id}
                  selected={c.id === selectedItem}
                  onClick={() => {
                    setSelectedItem?.(c.id);
                  }}
                >
                  {renderItem ? renderItem(c) : c.label}
                </ListGroupItem>
              ))}
            </React.Fragment>
          ))}
      </div>
    </>
  );
};

export default SearchableList;
