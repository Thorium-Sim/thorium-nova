import {Box, Button, Input, List, ListItem, PseudoBox} from "@chakra-ui/core";
import {
  EntityTypes,
  UniverseSearchDocument,
  UniverseSearchQuery,
  UniverseGetSystemDocument,
  UniverseGetObjectDocument,
} from "../../generated/graphql";
import {useCombobox} from "downshift";
import React from "react";
import {useTranslation} from "react-i18next";
import {css} from "@emotion/core";
import {useConfigStore} from "./configStore";
import {useApolloClient} from "@apollo/client";
import {Vector3} from "three";
import {getOrbitPosition} from "./utils";

function StarSearch() {
  const client = useApolloClient();
  const {t} = useTranslation();
  const universeId = useConfigStore(s => s.universeId);
  const [items, setItems] = React.useState<
    UniverseSearchQuery["universeSearch"]
  >([]);

  const itemToString = (
    item: UniverseSearchQuery["universeSearch"][0] | null
  ) => (item ? item.identity.name : "");

  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
    getInputProps,
    getComboboxProps,
  } = useCombobox({
    items,
    itemToString,
    onInputValueChange: ({inputValue}) => {
      if (inputValue) {
        client
          .query({
            query: UniverseSearchDocument,
            variables: {id: universeId, search: inputValue},
          })
          .then(res => setItems(res.data?.universeSearch || []));
      } else {
        setItems([]);
      }
    },
    onSelectedItemChange: ({selectedItem}) => {
      switch (selectedItem?.entityType) {
        case EntityTypes.System:
          client
            .query({
              query: UniverseGetSystemDocument,
              variables: {id: universeId, systemId: selectedItem.id},
            })
            .then(res => {
              if (res.data) {
                useConfigStore.getState().setSystemId("");
                useConfigStore.setState({
                  selectedObject: res.data.pluginUniverseSystem,
                });
                requestAnimationFrame(() => {
                  const {x, y, z} = res.data.pluginUniverseSystem.position;
                  useConfigStore
                    .getState()
                    .orbitControlsTrackPosition(new Vector3(x, y, z));
                });
              }
            });
          break;
        case EntityTypes.Star:
        case EntityTypes.Planet:
          client
            .query({
              query: UniverseGetObjectDocument,
              variables: {id: universeId, objectId: selectedItem.id},
            })
            .then(res => {
              if (res.data) {
                const parent =
                  res.data.universeTemplateObject?.satellite?.parent;
                let systemId = parent?.id;
                let isSatellite = false;
                if (parent?.entityType === EntityTypes.Planet) {
                  systemId = parent?.satellite?.parent?.id;
                  isSatellite = true;
                }

                if (systemId) {
                  useConfigStore
                    .getState()
                    .setSystemId(systemId)
                    .then(() => {
                      const {
                        eccentricity,
                        orbitalArc,
                        orbitalInclination,
                        distance,
                      } = res.data.universeTemplateObject.satellite;
                      const orbitRadius =
                        (isSatellite ? 100 : 1) * (distance / 1000000);

                      const parentPosition = isSatellite
                        ? getOrbitPosition({
                            eccentricity: parent.satellite.eccentricity,
                            orbitalArc: parent.satellite.orbitalArc,
                            orbitalInclination:
                              parent.satellite.orbitalInclination,
                            radius: parent.satellite.distance / 1000000,
                          })
                        : undefined;

                      useConfigStore.getState().orbitControlsTrackPosition(
                        getOrbitPosition({
                          eccentricity,
                          orbitalArc,
                          orbitalInclination,
                          radius: orbitRadius,
                          origin: parentPosition,
                        }),
                        selectedItem?.entityType === EntityTypes.Star ? 400 : 50
                      );
                    });
                }
                useConfigStore.setState({
                  selectedObject: res.data.universeTemplateObject,
                });
              }
            });
          break;
        case EntityTypes.Ship:
          break;
        default:
          return;
      }
    },
  });
  return (
    <Box position="relative">
      <Box display="inline-flex" {...getComboboxProps()}>
        <Input
          size="sm"
          type="search"
          justifySelf="end"
          maxWidth="300px"
          {...getInputProps({type: "search", placeholder: t("Search...")})}
        />
        <Button
          size="sm"
          {...getToggleButtonProps()}
          aria-label={t("toggle menu")}
        >
          &#8595;
        </Button>
      </Box>

      <List
        {...getMenuProps()}
        maxHeight="180px"
        minWidth="180px"
        overflowY="auto"
        margin={0}
        borderTop={0}
        bg="blackAlpha.500"
        color="white"
        borderColor="whiteAlpha.500"
        borderWidth={2}
        position="absolute"
        zIndex={1000}
        listStyle="none"
        padding={0}
        display={!isOpen ? "none" : ""}
      >
        {items.map((item, index) => {
          return (
            <ListItem
              bg={highlightedIndex === index ? "rgba(189,228,255, 0.5)" : ""}
              px={3}
              py={2}
              key={`${item}${index}`}
              {...getItemProps({item, index})}
            >
              <p> {itemToString(item)}</p>
              <p>
                <small>{item.entityType}</small>
              </p>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default StarSearch;
