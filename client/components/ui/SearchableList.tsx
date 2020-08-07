import React from "react";
import {Box, Input, PseudoBox} from "@chakra-ui/core";
import {capitalCase} from "change-case";
import matchSorter from "match-sorter";
import {css} from "@emotion/core";
import {FaEdit} from "react-icons/fa";
import {useTranslation} from "react-i18next";

interface SearchableListProps {
  items: ListItem[];
  selectedItem?: string | null;
  setSelectedItem?: (item: string) => void;
  renderItem?: (item: ListItem) => JSX.Element;
  searchKeys?: string[];
}
interface ListItem {
  id: string;
  [key: string]: any;
}

const ListGroupItem: React.FC<{
  onClick?: (event: React.MouseEvent<any>) => void;
  selected?: boolean;
  disabled?: boolean;
}> = ({onClick, selected, disabled, ...props}) => (
  <PseudoBox
    {...props}
    border="1px solid rgba(0, 0, 0, 0.125)"
    px={4}
    py={2}
    color={disabled ? "gray.400" : ""}
    pointerEvents={disabled ? "none" : "all"}
    className="list-group-item"
    css={css`
      & + .list-group-item {
        border-top-width: 0;
      }
    `}
    bg={selected ? "whiteAlpha.400" : ""}
    cursor="pointer"
    _hover={{
      bg: selected ? "whiteAlpha.500" : "whiteAlpha.50",
    }}
    _first={{
      borderTopLeftRadius: "0.25rem",
      borderTopRightRadius: "0.25rem",
    }}
    _last={{
      borderBottomLeftRadius: "0.25rem",
      borderBottomRightRadius: "0.25rem",
    }}
    onClick={onClick}
  />
);
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
    [items, search]
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
        placeholder={t("Search")}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearch(e.target.value)
        }
      />
      <Box flex={1} overflowY="auto">
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
                <ListGroupItem disabled>{capitalCase(key)}</ListGroupItem>
              )}
              {items.map(c => (
                <ListGroupItem
                  key={c.id}
                  selected={c.id === selectedItem}
                  onClick={() => setSelectedItem?.(c.id)}
                >
                  {renderItem ? renderItem(c) : c.label}
                </ListGroupItem>
              ))}
            </React.Fragment>
          ))}
      </Box>
    </>
  );
};

export default SearchableList;
