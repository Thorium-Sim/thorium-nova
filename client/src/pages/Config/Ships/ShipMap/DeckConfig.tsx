import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useParams} from "react-router-dom";
import PanZoom from "client/src/components/ui/PanZoom";
import useMeasure from "client/src/hooks/useMeasure";
import {useEffect, useMemo, useRef} from "react";
import Button from "@thorium/ui/Button";
import UploadWell from "@thorium/ui/UploadWell";
import {netSend} from "client/src/context/netSend";
import {useConfirm} from "@thorium/ui/AlertDialog";

export interface PanStateI {
  x: number;
  y: number;
  scale: number;
}

export function DeckConfig() {
  const {pluginId, shipId, deckName} = useParams() as {
    pluginId: string;
    shipId: string;
    deckName: string;
  };
  const data = useNetRequest("pluginShip", {pluginId, shipId});
  const deck = data.decks.find(d => d.name === deckName);
  if (!deck) {
    throw new Error("Deck not found");
  }
  const deckImage = deck.backgroundUrl;

  const [ref, dimensions, , node] = useMeasure<HTMLDivElement>();
  const panState = useRef<PanStateI>({x: 0, y: 0, scale: 1});

  const panned = useRef(false);

  const confirm = useConfirm();

  const elementNameRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (node) {
      function handleMouseOver(e: MouseEvent) {
        if (elementNameRef.current) {
          elementNameRef.current.textContent =
            (e.target as any)?.getAttribute("name") || "";
        }
      }
      node.addEventListener("mouseover", handleMouseOver);
      return () => {
        node.removeEventListener("mouseover", handleMouseOver);
      };
    }
  }, [node]);

  if (!deckImage) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <UploadWell
          accept="image/*"
          onChange={async files => {
            await netSend("pluginShipDeckUpdate", {
              pluginId,
              shipId,
              deckId: deck.name,
              backgroundImage: files[0],
            });
          }}
        />
        <small>Upload a background image for the deck</small>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 h-full " ref={ref}>
      <PanZoom
        key={`${deck.name}-${deckName}-${deckImage}`}
        onMouseDown={() => (panned.current = false)}
        style={{width: "100%", outline: "none", flex: 1}}
        className="text-purple-400 border-2 border-white/10 rounded-lg bg-gray-800 overflow-hidden"
        maxZoom={4}
        minZoom={0.5}
        noStateUpdate={false}
        onStateChange={(state: PanStateI) => {
          panned.current = true;
          panState.current = state;
        }}
      >
        <SVGImageLoader className="w-full h-full" url={deckImage} />
      </PanZoom>
      <div>
        <Button
          className="btn-error"
          onClick={async () => {
            if (
              await confirm({
                header: "Are you sure you want to remove this deck image?",
              })
            ) {
              await netSend("pluginShipDeckUpdate", {
                pluginId,
                shipId,
                deckId: deck.name,
                backgroundImage: null,
              });
            }
          }}
        >
          Remove Background
        </Button>
        <p ref={elementNameRef} className="h-4">
          &nbsp;
        </p>
      </div>
    </div>
  );
}
