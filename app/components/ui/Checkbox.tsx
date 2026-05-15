import { cn } from "@thorium/utils/cn";
import type React from "react";
import type { ReactNode } from "react";

const Checkbox = (
	props: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
		label: ReactNode;
		labelHidden?: boolean;
		labelProps?: React.DetailedHTMLProps<
			React.LabelHTMLAttributes<HTMLLabelElement>,
			HTMLLabelElement
		>;
		helperText?: string;
	},
) => {
	const { label, labelHidden, helperText, ...otherProps } = props;
	return (
		<>
			<label
				{...props.labelProps}
				className={cn("flex items-center select-none", props.labelProps?.className)}
			>
				<input
					type="checkbox"
					{...otherProps}
					className={`${props.className} form-checkbox mr-2 text-blue-600`}
				/>
				<span className={cn("flex items-center gap-1", { "sr-only": labelHidden })}>{label}</span>
			</label>
			{helperText && <p className="mb-2 text-sm leading-tight text-white">{helperText}</p>}
		</>
	);
};

export default Checkbox;
