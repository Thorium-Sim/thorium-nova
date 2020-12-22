import useWindowMove from "../../helpers/hooks/useWindowMove";
import React from "react";
import {FaMinus, FaTimes} from "react-icons/fa";
import {useTranslation} from "react-i18next";
import useSessionStorage from "../../helpers/hooks/useSessionStorage";
import {css} from "@emotion/core";
import Button from "./button";

const PropertyPalette: React.FC<{onClose: () => void}> = ({
  children,
  onClose,
}) => {
  const [
    position,
    measureRef,
    mouseDown,
    remeasure,
  ] = useWindowMove<HTMLDivElement>(
    useSessionStorage<{x: number; y: number} | null>(
      "nova_starmap_propertyPalette",
      null
    )
  );
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => {
    remeasure();
  }, [open, remeasure]);
  const {t} = useTranslation();
  return (
    <div
      className="flex flex-col select-none fixed top-0 rounded-lg"
      css={css`
        opacity: ${position.x === 0 && position.y === 0 ? 0 : 1};
        transform: translate(${position.x}px, ${position.y}px);
        background-color: rgba(45, 55, 72, 0.6);
        min-width: 300;
      `}
      ref={measureRef}
    >
      <div
        onMouseDown={mouseDown}
        className="border-whiteAlpha-400 border-b-2 bg-blackAlpha-500 hover:bg-blackAlpha-700 active:bg-blackAlpha-600 rounded-t-lg items-center px-2 grid"
        css={css`
          cursor: grab;
          &:active {
            cursor: grabbing;
          }
          height: 40px;
          grid-template-columns: 1fr auto 1fr;
        `}
        onDoubleClick={() => setOpen(o => !o)}
      >
        <div></div>
        <h3 className="font-bold text-xl">{t("Property Palette")}</h3>
        <div className="flex self-end">
          <Button
            variant="ghost"
            size="xs"
            aria-label={t(`Minimize`)}
            onClick={() => setOpen(o => !o)}
          >
            <FaMinus />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            aria-label={t(`Close`)}
            onClick={onClose}
          >
            <FaTimes />
          </Button>
        </div>
      </div>
      {open && (
        <div
          className="overflow-y-auto py-2"
          css={css`
            min-height: 200px;
            max-height: 400px;
          `}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default PropertyPalette;
