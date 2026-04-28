export default function DevLink({ children }: { children: string }) {
	return (
		<button className="font-mono text-purple-300" onClick={() => {}}>
			{children}
		</button>
	);
}
