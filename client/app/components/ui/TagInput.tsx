import React, { type ReactNode } from "react";
import Button from "./Button";
import { cn } from "@client/utils/cn";
import { Icon } from "./Icon";

const Tag: React.FC<{ tag: string; onClick: () => void }> = ({
	tag,
	onClick,
}) => {
	return (
		<button className="badge" data-testid="tag-remove">
			{tag}{" "}
			<Icon
				name="x"
				className="cursor-pointer rounded-full hover:bg-gray-700 active:bg-gray-800"
				onClick={onClick}
			/>
		</button>
	);
};
const TagInput: React.FC<{
	label: ReactNode;
	labelHidden?: boolean;
	tags: string[];
	disabled?: boolean;
	onRemove: (t: string) => void;
	onAdd: (t: string) => void;
	className?: string;
}> = ({
	tags = [],
	onRemove,
	onAdd,
	label,
	labelHidden,
	disabled,
	className,
}) => {
	const [tagInput, setTagInput] = React.useState("");
	return (
		<>
			<div className={cn("form-control", className)}>
				<label className={cn("label", { "sr-only": labelHidden })}>
					{label}
				</label>
				<input
					disabled={disabled}
					className="input"
					placeholder="Type and press return to add a tag"
					value={tagInput}
					onChange={(e) => setTagInput(e.currentTarget.value)}
					onBlur={() => {
						if (tagInput) {
							onAdd(tagInput);
							setTagInput("");
						}
					}}
					onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
						if (e.key === "," || e.key === "." || e.key === "Enter") {
							e.preventDefault();
							if (tagInput) {
								onAdd(tagInput);
								setTagInput("");
							}
						}
						if (e.key === "Tab") {
							if (tagInput) {
								onAdd(tagInput);
								setTagInput("");
							}
						}
						if (
							(e.key === "Backspace" || e.key === "Delete") &&
							tagInput === ""
						) {
							e.preventDefault();
							onRemove(tags[tags.length - 1]);
						}
					}}
				/>
			</div>
			<div className="flex flex-wrap">
				{tags.map((t) => (
					<Tag key={t} tag={t} onClick={() => onRemove(t)} />
				))}
			</div>
		</>
	);
};

export default TagInput;
