const colorBars = [
	"#ffffff",
	"#ffff00",
	"#00ffff",
	"#00ff00",
	"#ff00ff",
	"#ff0000",
	"#0000ff",
];

export function NoSignal() {
	return (
		<div className="w-full h-full bg-black flex items-center justify-center">
			<div className="w-full">
				<div className="flex h-16">
					{colorBars.map((color) => (
						<div
							key={color}
							className="flex-1"
							style={{ backgroundColor: color }}
						/>
					))}
				</div>
				<span className="viewscreen-no-signal-header block text-white text-3xl tracking-[0.3em] font-bold text-center mt-4">
					No Signal Found
				</span>
				<p className="viewscreen-no-signal-subtitle text-white/60 text-sm tracking-widest text-center mt-2">
					Camera Offline
				</p>
			</div>
		</div>
	);
}
