import Button from "@thorium/ui/Button";
import {netSend} from "client/src/context/netSend";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useNavigate, useParams, Outlet, Link} from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {restrictToVerticalAxis} from "@dnd-kit/modifiers";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

export function SortableItem({
  id,
  name,
  deckIndex,
}: {
  id: string;
  name: string;
  deckIndex: string;
}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
    useSortable({id: id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`list-group-item !p-0 transition-[border-radius] ${
        deckIndex === id ? "selected" : ""
      } touch-none ${isDragging ? "!border !rounded" : ""}`}
    >
      <Link
        to={id}
        // Pointer-events-none is necessary to avoid navigating when the sorting is done
        className={`block px-4 py-2 ${isDragging ? "pointer-events-none" : ""}`}
      >
        {name}
      </Link>
    </li>
  );
}

export function ShipMap() {
  const {pluginId, shipId, deckIndex} = useParams() as {
    pluginId: string;
    shipId: string;
    deckIndex: string;
  };
  const navigate = useNavigate();
  const data = useNetRequest("pluginShip", {pluginId, shipId});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {distance: 5},
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  async function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (!over?.id) return;
    if (active.id !== over?.id) {
      const result = await netSend("pluginShipDeckUpdate", {
        pluginId,
        shipId,
        index: Number(active.id),
        newIndex: Number(over.id),
      });
      if (result) {
        navigate(result);
      }
    }
  }

  return (
    <>
      <div className="w-72">
        <ul className="mb-2 relative">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={data.decks.map((deck, index) => ({
                ...deck,
                id: index.toString(),
              }))}
              strategy={verticalListSortingStrategy}
            >
              {data.decks.map((deck, i) => (
                <SortableItem
                  key={i}
                  name={deck.name}
                  id={i.toString()}
                  deckIndex={deckIndex}
                />
              ))}
            </SortableContext>
          </DndContext>
        </ul>
        <Button
          className="btn-success w-full"
          onClick={async () => {
            const deckIndex = await netSend("pluginShipDeckCreate", {
              pluginId,
              shipId,
            });
            if (deckIndex === null) return;
            navigate(deckIndex.toString());
          }}
        >
          Add Deck
        </Button>
      </div>
      <Outlet />
    </>
  );
}
