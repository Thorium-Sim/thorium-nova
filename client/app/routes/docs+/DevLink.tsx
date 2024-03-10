export default function DevLink({ children }: { children: string }) {
	return (
		<button className="text-purple-300 font-mono" onClick={() => {}}>
			{children}
		</button>
	);
}
