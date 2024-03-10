import col from "color";
export default function LinearDotIndicator({
	level = 1,
	color = "rainbow",
	reverse = false,
	dotCount = 20,
}:
	| { dotCount?: number; level?: number; color?: string; reverse?: null }
	| { dotCount?: number; level?: number; color: "rainbow"; reverse?: boolean }
	| {
			dotCount?: number;
			level?: number;
			color?: undefined;
			reverse?: boolean;
	  }) {
	function calcColor(i: number) {
		let outputColor: any;
		if (color === "rainbow") {
			outputColor = col().hsl(reverse ? i * 5 : Math.abs(i * 5 - 90), 100, 50);
		} else {
			outputColor = col(color);
		}
		outputColor = level * 20 >= i ? outputColor : col("rgb(80,80,80)");
		return outputColor;
	}

	return (
		<div className="flex justify-between">
			{Array(dotCount)
				.fill(0)
				.map((_, i) => {
					return (
						<div
							key={`dot-${i}`}
							className={`w-2 h-2 rounded-full`}
							style={{
								["--dot-color" as any]: calcColor(i).rgb().toString(),
								["--dot-highlight" as any]: calcColor(i)
									.lighten(0.1)
									.rgb()
									.toString(),
								["--dot-border" as any]: calcColor(i)
									.alpha(0.25)
									.rgb()
									.toString(),
								background: `radial-gradient(ellipse at center, var(--dot-color) 0%,var(--dot-border) 90%)`,
								// boxShadow: `0px 0px 5px var(--dot-highlight)`,
							}}
						/>
					);
				})}
		</div>
	);
}
