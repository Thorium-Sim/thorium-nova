import React from "react";
import ReactDOM from "react-dom";
import {ChromePicker} from "react-color";
import useOnClickOutside from "./hooks/useClickOutside";
import tc from "tinycolor2";
import {useTranslation} from "react-i18next";

const ColorPicker: React.FC<{
  color: any;
  onChangeComplete: (value: string | tc.Instance) => void;
  format?: "rgb" | "raw" | "hex";
}> = ({color, onChangeComplete, format = "rgb"}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = React.useState<{x: number; y: number} | false>(
    false
  );
  const [currentColor, setCurrentColor] = React.useState(color);
  useOnClickOutside(ref, () => setIsOpen(false));

  const {t} = useTranslation();
  return (
    <>
      <button
        title={t`Color Picker`}
        style={{
          padding: "5px",
          background: "#fff",
          borderRadius: "1px",
          boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
          display: "inline-block",
          cursor: "pointer",
        }}
        onClick={e => setIsOpen({x: e.clientX, y: e.clientY})}
      >
        <div
          style={{
            width: "36px",
            height: "14px",
            borderRadius: "2px",
            background: tc(color).toHexString(),
          }}
        />
      </button>
      {isOpen &&
        ReactDOM.createPortal(
          <div
            ref={ref}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translate(${isOpen.x}px, ${isOpen.y - 40}px)`,
              zIndex: 1,
            }}
          >
            <ChromePicker
              color={currentColor}
              onChange={color =>
                setCurrentColor(
                  format === "rgb"
                    ? tc({
                        r: color.rgb.r,
                        g: color.rgb.g,
                        b: color.rgb.b,
                        a: color.rgb.a,
                      }).toRgbString()
                    : format === "raw"
                    ? tc({
                        r: color.rgb.r,
                        g: color.rgb.g,
                        b: color.rgb.b,
                        a: color.rgb.a,
                      })
                    : tc(color.hex).toHexString()
                )
              }
              onChangeComplete={color =>
                onChangeComplete(
                  format === "rgb"
                    ? tc({
                        r: color.rgb.r,
                        g: color.rgb.g,
                        b: color.rgb.b,
                        a: color.rgb.a,
                      }).toRgbString()
                    : format === "raw"
                    ? tc({
                        r: color.rgb.r,
                        g: color.rgb.g,
                        b: color.rgb.b,
                        a: color.rgb.a,
                      })
                    : tc(color.hex).toHexString()
                )
              }
            />
          </div>,
          document.body
        )}
    </>
  );
};

export default ColorPicker;
