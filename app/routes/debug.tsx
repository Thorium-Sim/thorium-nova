export default function () {
	return (
		<>
			<div className="relative flex h-8 w-full items-center justify-center gap-4 overflow-hidden text-red-500">
				<div className="animate-pong aspect-[1/2] h-full skew-x-[76deg] bg-current [animation-delay:375ms]" />
				<div className="animate-pong aspect-[1/2] h-full skew-x-[72deg] bg-current [animation-delay:300ms]" />
				<div className="animate-pong aspect-[1/2] h-full skew-x-[64deg] bg-current [animation-delay:225ms]" />
				<div className="animate-pong aspect-[1/2] h-full skew-x-[48deg] bg-current [animation-delay:150ms]" />
				<div className="animate-pong aspect-[1/2] h-full skew-x-[32deg] bg-current [animation-delay:75ms]" />
				<div className="animate-pong aspect-[1/2] h-full skew-x-[24deg] bg-current" />
				<p className="animate-pulse text-4xl font-bold" style={{ fontFamily: "Dungeon" }}>
					RED ALERT
				</p>
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[24deg] bg-current" />
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[32deg] bg-current [animation-delay:75ms]" />
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[48deg] bg-current [animation-delay:150ms]" />
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[64deg] bg-current [animation-delay:225ms]" />
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[72deg] bg-current [animation-delay:300ms]" />
				<div className="animate-pong aspect-[1/2] h-full -skew-x-[76deg] bg-current [animation-delay:375ms]" />
			</div>
			<div className="relative flex h-8 w-full items-center justify-center gap-2 overflow-hidden text-purple-500">
				<div className="animate-pong aspect-[1/3] h-full bg-current" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:75ms]" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:150ms]" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:225ms]" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:300ms]" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:375ms]" />
				<p className="animate-pulse text-4xl font-bold" style={{ fontFamily: "Dungeon" }}>
					DANGER NOODLE
				</p>
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:375ms]" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:300ms]" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:225ms]" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:150ms]" />
				<div className="animate-pong aspect-[1/3] h-full bg-current [animation-delay:75ms]" />
				<div className="animate-pong aspect-[1/3] h-full bg-current" />
			</div>
		</>
	);
}
