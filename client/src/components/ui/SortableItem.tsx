import {Link} from "react-router-dom";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {cn} from "@client/utils/cn";
import {ReactNode, useEffect, useState} from "react";
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

export function SortableItem({
  id,
  children,
  className,
  onClick,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
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
      className={cn(
        `list-group-item !p-0 transition-[border-radius] touch-none ${
          isDragging ? "!border !rounded isolate" : ""
        }`,
        className
      )}
      onClick={onClick}
    >
      {onClick ? (
        <span
          className={`block px-4 py-2 ${
            isDragging ? "pointer-events-none" : ""
          }`}
        >
          {children}
        </span>
      ) : (
        <Link
          to={id || "#"}
          // Pointer-events-none is necessary to avoid navigating when the sorting is done
          className={`block px-4 py-2 ${
            isDragging ? "pointer-events-none" : ""
          }`}
        >
          {children}
        </Link>
      )}
    </li>
  );
}

export function SortableList({
  onDragEnd,
  className,
  outerClassName,
  items,
  selectedItem,
  onClick,
}: {
  items: {id: string; children: ReactNode}[];
  selectedItem?: string;
  onDragEnd: (params: {
    active: DragEndEvent["active"];
    over: DragEndEvent["over"];
    activeIndex: number;
    overIndex: number;
  }) => void;
  className?: string;
  outerClassName?: string;
  onClick?: (id: string, index: number) => void;
}) {
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
    const activeIndex = active.data.current?.sortable.index;
    const overIndex = over?.data.current?.sortable.index;

    if (typeof overIndex !== "number") return;
    if (activeIndex !== overIndex) {
      onDragEnd({active, over, activeIndex, overIndex});
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-y-auto overflow-x-hidden",
        outerClassName
      )}
    >
      <ul className={cn("relative", className)}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item, index) => ({
              ...item,
              index,
            }))}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item, index) => (
              <SortableItem
                key={item.id}
                id={item.id}
                className={selectedItem === item.id ? "selected" : ""}
                onClick={onClick ? () => onClick?.(item.id, index) : undefined}
              >
                {item.children}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </ul>
    </div>
  );
}
