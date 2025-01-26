import { forwardRef, useImperativeHandle, useRef } from "react";

const RadialDial = forwardRef<
	{ setValue: (value: number) => void },
	{
		label: string;
		count: number;
		max?: number;
		marker?: number;
		color?: string;
		backgroundColor?: string;
		children?: React.ReactNode;
	}
>(
	(
		{
			label,
			count,
			max = 100,
			marker,
			color = "#fff000",
			backgroundColor,
			children,
		},
		ref,
	) => {
		const divRef = useRef<HTMLDivElement>(null);
		useImperativeHandle(
			ref,
			() => {
				return {
					setValue(value: number) {
						if (!divRef.current) return;
						const endAngle = value / max;
						divRef.current.style.setProperty(
							"--end-angle",
							`${endAngle * 100}%`,
						);

						divRef.current.style.setProperty(
							"background",
							`conic-gradient(
    var(--radial-color, #fff000) 0%,
		${
			marker && marker < endAngle
				? `var(--radial-color, #fff000) ${(marker / max) * 100 - 1}%, yellow ${
						(marker / max) * 100
				  }%, yellow ${
						(marker / max) * 100 + 1
				  }%, var(--radial-color, #fff000)  ${(marker / max) * 100 + 2}%,`
				: ""
		}
    var(--radial-color, #fff000) var(--end-angle, 0%),
    var(--radial-background) var(--end-angle, 0%),
		${
			marker && marker > endAngle
				? `var(--radial-background) ${(marker / max) * 100 - 1}%, yellow ${
						(marker / max) * 100
				  }%, yellow ${(marker / max) * 100 + 1}%,var(--radial-background) ${
						(marker / max) * 100 + 2
				  }%,`
				: ""
		}
    var(--radial-background) 100%
  )`,
						);
					},
				};
			},
			[max, marker],
		);

		return (
			<div className="radial-dial">
				<div
					className="radial-indicator"
					ref={divRef}
					style={{
						background: `conic-gradient(
    var(--radial-color, #fff000) 0%,
    var(--radial-color, #fff000) var(--end-angle, 0%),
    var(--radial-background) var(--end-angle, 0%),
    var(--radial-background) 100%
  )`,
						["--radial-color" as any]: color,
						["--radial-background" as any]: backgroundColor,
						["--end-angle" as any]: `${(count / max) * 100}%`,
					}}
				>
					<div className="radial-inner">{children || Math.round(count)}</div>
				</div>
				<div className="label">{label}</div>
			</div>
		);
	},
);

RadialDial.displayName = "RadialDial";

export default RadialDial;
