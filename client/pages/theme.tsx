import {ThemeProvider, theme as defaultTheme} from "@chakra-ui/core";
import Button from "../components/ui/button";
import React from "react";
import ColorPicker from "../helpers/colorPicker";
import getColorScheme from "../helpers/generateColorScheme";
import {css} from "@emotion/core";

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
          themeColors.primary.center
        ),
        secondary: getColorScheme(
          themeColors.secondary.color,
          themeColors.secondary.spread,
          themeColors.secondary.center
        ),
        info: getColorScheme(
          themeColors.info.color,
          themeColors.info.spread,
          themeColors.info.center
        ),
        alert: getColorScheme(
          themeColors.alert.color,
          themeColors.alert.spread,
          themeColors.alert.center
        ),
        warning: getColorScheme(
          themeColors.warning.color,
          themeColors.warning.spread,
          themeColors.warning.center
        ),
        danger: getColorScheme(
          themeColors.danger.color,
          themeColors.danger.spread,
          themeColors.danger.center
        ),
        success: getColorScheme(
          themeColors.success.color,
          themeColors.success.spread,
          themeColors.success.center
        ),
        muted: getColorScheme(
          themeColors.muted.color,
          themeColors.muted.spread,
          themeColors.muted.center
        ),
      },
    }),
    [themeColors]
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
      <div className="flex justify-center text-white">
        <div className="w-full max-w-5xl mx-4 mt-10">
          <h1 className="text-4xl font-bold">Theme Builder</h1>
          <h2 className="text-2xl font-bold mt-4">Colors</h2>
          <div className="ml-4 mt-4">
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
                <div
                  data-testid={`theme-${scheme}`}
                  key={scheme}
                  className="grid items-center"
                  css={css`
                    grid-template-columns: 1fr auto auto auto auto auto auto;
                  `}
                >
                  <h3 className="mr-3 text-xl font-bold">{scheme}</h3>
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
                  <div className="mx-4">
                    <p>Lightness Spread</p>
                    <input
                      type="range"
                      value={themeColors[scheme].spread}
                      onChange={e =>
                        setThemeColors(c => ({
                          ...c,
                          [scheme]: {...c[scheme], spread: e.target.value},
                        }))
                      }
                      min={0.1}
                      max={15}
                      step={0.1}
                    />
                  </div>
                  <div className="mx-4">
                    <p>Lightness Center</p>
                    <input
                      type="range"
                      value={themeColors[scheme].center}
                      onChange={e =>
                        setThemeColors(c => ({
                          ...c,
                          [scheme]: {...c[scheme], center: e.target.value},
                        }))
                      }
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                  <Button className="mx-1" variantColor={scheme}>
                    Test Button
                  </Button>
                  <Button
                    className="mx-1"
                    variantColor={scheme}
                    variant="outline"
                  >
                    Test Button
                  </Button>
                  <Button
                    className="mx-1"
                    variantColor={scheme}
                    variant="ghost"
                  >
                    Test Button
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default ThemeBuilder;
