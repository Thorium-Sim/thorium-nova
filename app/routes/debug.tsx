export default function () {
	return (
		<>
			<div className="w-full flex items-center justify-center text-red-500 gap-4 relative overflow-hidden h-8">
				<div className="h-full aspect-[1/2] skew-x-[76deg] bg-current animate-pong [animation-delay:375ms]" />
				<div className="h-full aspect-[1/2] skew-x-[72deg] bg-current animate-pong [animation-delay:300ms]" />
				<div className="h-full aspect-[1/2] skew-x-[64deg] bg-current animate-pong [animation-delay:225ms]" />
				<div className="h-full aspect-[1/2] skew-x-[48deg] bg-current animate-pong [animation-delay:150ms]" />
				<div className="h-full aspect-[1/2] skew-x-[32deg] bg-current animate-pong [animation-delay:75ms]" />
				<div className="h-full aspect-[1/2] skew-x-[24deg] bg-current animate-pong" />
				<p
					className="text-4xl font-bold animate-pulse"
					style={{ fontFamily: "Dungeon" }}
				>
					RED ALERT
				</p>
				<div className="h-full aspect-[1/2] -skew-x-[24deg] bg-current animate-pong" />
				<div className="h-full aspect-[1/2] -skew-x-[32deg] bg-current animate-pong [animation-delay:75ms]" />
				<div className="h-full aspect-[1/2] -skew-x-[48deg] bg-current animate-pong [animation-delay:150ms]" />
				<div className="h-full aspect-[1/2] -skew-x-[64deg] bg-current animate-pong [animation-delay:225ms]" />
				<div className="h-full aspect-[1/2] -skew-x-[72deg] bg-current animate-pong [animation-delay:300ms]" />
				<div className="h-full aspect-[1/2] -skew-x-[76deg] bg-current animate-pong [animation-delay:375ms]" />
			</div>
			<div className="w-full flex items-center justify-center text-purple-500 gap-2 relative overflow-hidden h-8">
				<div className="h-full aspect-[1/3] bg-current animate-pong" />
				<div className="h-full aspect-[1/3] bg-current animate-pong [animation-delay:75ms]" />
				<div className="h-full aspect-[1/3] bg-current animate-pong [animation-delay:150ms]" />
				<div className="h-full aspect-[1/3] bg-current animate-pong [animation-delay:225ms]" />
				<div className="h-full aspect-[1/3] bg-current animate-pong [animation-delay:300ms]" />
				<div className="h-full aspect-[1/3] bg-current animate-pong [animation-delay:375ms]" />
				<p
					className="text-4xl font-bold animate-pulse"
					style={{ fontFamily: "Dungeon" }}
				>
					DANGER NOODLE
				</p>
				<div className="h-full aspect-[1/3] bg-current animate-pong [animation-delay:375ms]" />
				<div className="h-full aspect-[1/3] bg-current animate-pong [animation-delay:300ms]" />
				<div className="h-full aspect-[1/3] bg-current animate-pong [animation-delay:225ms]" />
				<div className="h-full aspect-[1/3] bg-current animate-pong [animation-delay:150ms]" />
				<div className="h-full aspect-[1/3] bg-current animate-pong [animation-delay:75ms]" />
				<div className="h-full aspect-[1/3] bg-current animate-pong" />
			</div>
		</>
	);
}
