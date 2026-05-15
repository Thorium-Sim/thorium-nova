import styles from "./Credits.module.css";

const creditList = [
	{
		header: "Created By",
		content: "Alex Anderson",
	},
	{
		header: "Strategy & Design",
		content: "Crystal Anderson",
	},
	{
		header: "Development",
		content: "Tanner Chamberlain",
	},
	{
		header: "Documentation",
		content: (
			<>
				Deven <em>"AdminAnonymous"</em> North
			</>
		),
	},
	{
		header: "Inspiration",
		content: "Victor Williamson",
	},
	{
		header: "Conceptual Development",
		content: "Matt Ricks",
	},
	{
		header: "Conceptual Development",
		content: "Natalie Brianne",
	},
	{
		header: (
			<a
				href="https://github.com/Thorium-Sim/thorium-nova/blob/develop/CONTRIBUTING.md"
				target="_blank"
				rel="noreferrer"
				className="text-primary underline"
			>
				Contributors Welcome
			</a>
		),
		content: (
			<a
				href="https://github.com/Thorium-Sim/thorium-nova/blob/develop/CONTRIBUTING.md"
				target="_blank"
				rel="noreferrer"
				className="text-primary underline"
			>
				Your Name Here
			</a>
		),
	},
];

const Credits = ({ className }: { className?: string }) => {
	return (
		<div
			className={`${className || ""} ${
				styles.credits
			} max-h-72 self-end overflow-y-hidden text-right`}
		>
			<div
				className={`${styles["all-credits"]} my-8`}
				style={{ ["--credits-duration" as any]: `${creditList.length * 2}s` }}
			>
				{creditList.map((c, i) => (
					<div key={i} className="py-2 text-white">
						<p>{c.header}</p>
						<p className="mt-1 text-lg font-bold">{c.content}</p>
					</div>
				))}
				<div className="h-8" />
				{creditList.map((c, i) => (
					<div key={i} className="py-2 text-white">
						<p>{c.header}</p>
						<p className="mt-1 text-lg font-bold">{c.content}</p>
					</div>
				))}
			</div>
		</div>
	);
};

export default Credits;
