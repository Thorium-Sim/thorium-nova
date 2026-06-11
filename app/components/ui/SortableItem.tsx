import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { cn } from "@thorium/utils/cn";
import { type ComponentProps, type ReactNode } from "react";
import { useNavigate } from "react-router";

export function SortableItem({
	id,
	index,
	children,
	className,
	onClick,
}: {
	id: string;
	index: number;
	children: ReactNode | ((sortable: ReturnType<typeof useSortable>) => ReactNode);
	className?: string;
	onClick?: () => void;
}) {
	const sortable = useSortable({
		id,
		index,
		modifiers: [RestrictToVerticalAxis],
	});
	const navigate = useNavigate();
	return (
		<li
			ref={sortable.ref}
			className={cn(
				`list-group-item touch-none transition-[border-radius] ${
					sortable.isDragging ? "dragging isolate rounded! border!" : ""
				}`,
				className,
			)}
			onClick={onClick || (() => navigate(id || "#"))}
		>
			<span className={`block ${sortable.isDragging ? "pointer-events-none" : ""}`}>
				{typeof children === "function" ? children(sortable) : children}
			</span>
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
	items: {
		id: string;
		children: ReactNode | ((sortable: ReturnType<typeof useSortable>) => ReactNode);
		className?: string;
	}[];
	selectedItem?: string | null;
	onDragEnd: ComponentProps<typeof DragDropProvider>["onDragEnd"];
	className?: string;
	outerClassName?: string;
	onClick?: (id: string, index: number) => void;
}) {
	return (
		<div className={cn("relative overflow-y-auto overflow-x-hidden", outerClassName)}>
			<ul className={cn("relative", className)}>
				<DragDropProvider modifiers={[RestrictToVerticalAxis]} onDragEnd={onDragEnd}>
					{items.map((item, index) => (
						<SortableItem
							key={item.id}
							id={item.id}
							index={index}
							className={cn(item.className, selectedItem === item.id ? "selected" : "")}
							onClick={onClick ? () => onClick?.(item.id, index) : undefined}
						>
							{item.children}
						</SortableItem>
					))}
				</DragDropProvider>
			</ul>
		</div>
	);
}
