const RadialDial: React.FC<{
	label: string;
	count: number;
	max?: number;
	color?: string;
}> = ({ label, count, max = 100, color = "#fff000" }) => {
	return (
		<div className="radial-dial">
			<div
				className="radial-indicator"
				style={{
					["--radial-color" as any]: color,
					["--end-angle" as any]: `${(count / max) * 100}%`,
				}}
				data-value={Math.round(count)}
			/>
			<div className="label">{label}</div>
		</div>
	);
};

export default RadialDial;
