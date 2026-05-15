import { cn } from "@thorium/utils/cn";
import React, { type ReactNode } from "react";

import { Icon } from "./Icon";

const Tag: React.FC<{ tag: string; onClick: () => void }> = ({ tag, onClick }) => {
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
	placeholder?: string;
	tags: string[];
	disabled?: boolean;
	onRemove: (t: string) => void;
	onAdd: (t: string) => void;
	className?: string;
	omitChars?: string[];
}> = ({
	tags,
	onRemove,
	onAdd,
	label,
	labelHidden,
	disabled,
	placeholder = "Type and press return to add a tag",
	omitChars = [".", ","],
	className,
}) => {
	const [tagInput, setTagInput] = React.useState("");
	return (
		<>
			<div className={cn("form-control", className)}>
				<span className={cn("label", { "sr-only": labelHidden })}>{label}</span>
				<input
					disabled={disabled}
					className="input"
					placeholder={placeholder}
					value={tagInput}
					onChange={(e) => setTagInput(e.currentTarget.value)}
					onBlur={() => {
						if (tagInput) {
							onAdd(tagInput);
							setTagInput("");
						}
					}}
					onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
						if (omitChars.includes(e.key) || e.key === "Enter") {
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
						if ((e.key === "Backspace" || e.key === "Delete") && tagInput === "") {
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
