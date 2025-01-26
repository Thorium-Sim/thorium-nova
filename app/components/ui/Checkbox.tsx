import type React from "react";
import type { ReactNode } from "react";

const Checkbox = (
	props: React.DetailedHTMLProps<
		React.InputHTMLAttributes<HTMLInputElement>,
		HTMLInputElement
	> & { label: ReactNode; labelHidden?: boolean; helperText?: string },
) => {
	const { label, labelHidden, helperText, ...otherProps } = props;
	return (
		<>
			<label className="flex items-center select-none">
				<input
					type="checkbox"
					{...otherProps}
					className={`${props.className} form-checkbox mr-2 text-blue-600`}
				/>
				<span className={labelHidden ? "sr-only" : ""}>{label}</span>
			</label>
			{helperText && (
				<p className="text-white text-sm leading-tight mb-2">{helperText}</p>
			)}
		</>
	);
};

export default Checkbox;
