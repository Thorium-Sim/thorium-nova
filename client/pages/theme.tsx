import {
  Box,
  Flex,
  Heading,
  ThemeProvider,
  theme as defaultTheme,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
} from "@chakra-ui/core";
import Button from "../components/ui/button";
import React from "react";
import ColorPicker from "../helpers/colorPicker";
import getColorScheme from "../helpers/generateColorScheme";

const ThemeBuilder = () => {
  const [themeColors, setThemeColors] = React.useState({
    primary: {color: defaultTheme.colors.blue[500], spread: 10, center: 50},
    secondary: {color: defaultTheme.colors.gray[500], spread: 10, center: 50},
    info: {color: defaultTheme.colors.teal[500], spread: 10, center: 50},
    alert: {color: defaultTheme.colors.purple[500], spread: 10, center: 50},
    warning: {color: defaultTheme.colors.orange[500], spread: 10, center: 50},
    danger: {color: defaultTheme.colors.red[500], spread: 10, center: 50},
    success: {color: defaultTheme.colors.green[500], spread: 10, center: 50},
    muted: {color: "#888", spread: 10, center: 50},
  });
  const theme = React.useMemo(
    () => ({
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        primary: getColorScheme(
          themeColors.primary.color,
          themeColors.primary.spread,
          themeColors.primary.center,
        ),
        secondary: getColorScheme(
          themeColors.secondary.color,
          themeColors.secondary.spread,
          themeColors.secondary.center,
        ),
        info: getColorScheme(
          themeColors.info.color,
          themeColors.info.spread,
          themeColors.info.center,
        ),
        alert: getColorScheme(
          themeColors.alert.color,
          themeColors.alert.spread,
          themeColors.alert.center,
        ),
        warning: getColorScheme(
          themeColors.warning.color,
          themeColors.warning.spread,
          themeColors.warning.center,
        ),
        danger: getColorScheme(
          themeColors.danger.color,
          themeColors.danger.spread,
          themeColors.danger.center,
        ),
        success: getColorScheme(
          themeColors.success.color,
          themeColors.success.spread,
          themeColors.success.center,
        ),
        muted: getColorScheme(
          themeColors.muted.color,
          themeColors.muted.spread,
          themeColors.muted.center,
        ),
      },
    }),
    [themeColors],
  );
  const schemes = [
    "primary",
    "secondary",
    "info",
    "alert",
    "warning",
    "danger",
    "success",
    "muted",
  ];
  return (
    <ThemeProvider theme={theme}>
      <Flex justifyContent="center" color="white">
        <Box width="100%" maxWidth="960px" marginX={4} marginTop={10}>
          <Heading as="h1" size="xl">
            Theme Builder
          </Heading>
          <Heading as="h2" size="lg" marginTop={4}>
            Colors
          </Heading>
          <Box marginLeft={4} marginTop={4}>
            {schemes.map(colorScheme => {
              const scheme = colorScheme as
                | "primary"
                | "secondary"
                | "info"
                | "alert"
                | "warning"
                | "danger"
                | "success"
                | "muted";
              return (
                <Flex
                  data-testid={`theme-${scheme}`}
                  key={scheme}
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                >
                  <Flex flex={1} alignItems="center">
                    <Heading as="h3" size="md" mr={4}>
                      {scheme}
                    </Heading>
                    <ColorPicker
                      color={themeColors[scheme].color}
                      onChangeComplete={color =>
                        typeof color === "string" &&
                        setThemeColors(c => ({
                          ...c,
                          [scheme]: {...c[scheme], color},
                        }))
                      }
                    />
                    <Box mx={4}>
                      <Text>Lightness Spread</Text>
                      <Slider
                        value={themeColors[scheme].spread}
                        onChange={spread =>
                          setThemeColors(c => ({
                            ...c,
                            [scheme]: {...c[scheme], spread},
                          }))
                        }
                        min={0.1}
                        max={15}
                        step={0.1}
                      >
                        <SliderTrack />
                        <SliderFilledTrack />
                        <SliderThumb />
                      </Slider>
                    </Box>
                    <Box mx={4}>
                      <Text>Lightness Center</Text>
                      <Slider
                        value={themeColors[scheme].center}
                        onChange={center =>
                          setThemeColors(c => ({
                            ...c,
                            [scheme]: {...c[scheme], center},
                          }))
                        }
                        min={0}
                        max={100}
                        step={1}
                      >
                        <SliderTrack />
                        <SliderFilledTrack />
                        <SliderThumb />
                      </Slider>
                    </Box>
                  </Flex>
                  <Button mx={1} variantColor={scheme}>
                    Test Button
                  </Button>
                  <Button mx={1} variantColor={scheme} variant="outline">
                    Test Button
                  </Button>
                  <Button mx={1} variantColor={scheme} variant="ghost">
                    Test Button
                  </Button>
                  <Button mx={1} variantColor={scheme} variant="link">
                    Test Button
                  </Button>
                </Flex>
              );
            })}
          </Box>
        </Box>
      </Flex>
    </ThemeProvider>
  );
};

export default ThemeBuilder;
