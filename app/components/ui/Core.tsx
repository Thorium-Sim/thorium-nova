import { cn } from "@thorium/utils/cn";
import type {
	DetailedHTMLProps,
	HTMLAttributes,
	TextareaHTMLAttributes,
} from "react";

export function InputField({
	children,
	promptValue = "",
	prompt: inputPrompt,
	alert = false,
	onClick,
	className,
	...props
}: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
	promptValue?: string | number;
	prompt: string;
	alert?: boolean;
	onClick: (value: string | number) => void;
}) {
	return (
		<div
			className={cn(
				"text-black bg-yellow-200 border border-yellow-300 whitespace-pre text-center",
				{
					"bg-red-500 border-red-700": alert,
				},
				className,
			)}
			{...props}
			onClick={() => {
				const childrenValue =
					typeof children === "string" || typeof children === "number"
						? children
						: null;
				const value = prompt(
					inputPrompt,
					String(promptValue || childrenValue || ""),
				);
				if (value === null) return;
				const parseValue = Number.isNaN(Number(value)) ? value : Number(value);
				onClick(String(parseValue));
			}}
		>
			{children || <>&nbsp;</>}
		</div>
	);
}

export function OutputField({
	children = null,
	alert,
	className,
	...props
}: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
	alert?: boolean;
}) {
	return (
		<div
			className={cn(
				"text-black bg-blue-400 border border-blue-500 whitespace-pre text-center",
				{
					"bg-red-500 border-red-700": alert,
				},
				className,
			)}
			{...props}
		>
			{children || <>&nbsp;</>}
		</div>
	);
}

export function TypingField({
	alert,
	className,
	...props
}: DetailedHTMLProps<
	TextareaHTMLAttributes<HTMLTextAreaElement>,
	HTMLTextAreaElement
> & { alert?: boolean }) {
	return (
		<textarea
			{...props}
			className={cn(
				"resize-none text-center border border-gray-700 bg-slate-400 text-black",
				{
					"bg-red-500 border-red-700": alert,
				},
				className,
			)}
		/>
	);
}

// export const TypingField: React.FC<{
// 	style?: CSSProperties;
// 	onChange?: (
// 		event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
// 	) => void;
// 	className?: string;
// 	onBlur?: (
// 		event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
// 	) => void;
// 	value?: any;
// 	rows?: number;
// 	input?: boolean;
// 	controlled?: boolean;
// 	placeholder?: string;
// 	alert?: boolean;
// 	onDoubleClick?: (
// 		event: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement, MouseEvent>,
// 	) => void;
// }> = ({
// 	style = {},
// 	onChange,
// 	className = "",
// 	onBlur,
// 	value = undefined,
// 	rows = undefined,
// 	input = undefined,
// 	controlled = false,
// 	placeholder = "",
// 	alert = false,
// 	onDoubleClick,
// }) => {
// 	const compStyle = Object.assign(
// 		{
// 			backgroundColor: "#B4B4B4",
// 			border: "solid 1px #434343",
// 			height: "16px",
// 			resize: "none",
// 			textAlign: "center",
// 			width: "100%",
// 		},
// 		style,
// 	);
// 	if (alert) {
// 		compStyle.backgroundColor = "#f00";
// 		compStyle.borderColor = "#a00";
// 	}
// 	if (input) {
// 		if (controlled) {
// 			return (
// 				<input
// 					type="text"
// 					placeholder={placeholder}
// 					className={`typing-field ${className}`}
// 					onChange={onChange}
// 					onBlur={onBlur}
// 					style={compStyle}
// 					value={value || ""}
// 					onDoubleClick={onDoubleClick}
// 				/>
// 			);
// 		}
// 		return (
// 			<input
// 				type="text"
// 				placeholder={placeholder}
// 				className={`typing-field ${className}`}
// 				onChange={onChange}
// 				onBlur={onBlur}
// 				style={compStyle}
// 				defaultValue={value || ""}
// 				onDoubleClick={onDoubleClick}
// 			/>
// 		);
// 	}
// 	if (controlled) {
// 		return (
// 			<textarea
// 				placeholder={placeholder}
// 				className={`typing-field ${className}`}
// 				rows={rows}
// 				onChange={onChange}
// 				onBlur={onBlur}
// 				style={compStyle}
// 				value={value || ""}
// 			/>
// 		);
// 	}
// 	return (
// 		<textarea
// 			className={`typing-field ${className}`}
// 			rows={rows}
// 			onChange={onChange}
// 			onBlur={onBlur}
// 			style={compStyle}
// 			defaultValue={value || ""}
// 		/>
// 	);
// };
