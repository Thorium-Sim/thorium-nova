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
				className="underline text-primary"
			>
				Contributors Welcome
			</a>
		),
		content: (
			<a
				href="https://github.com/Thorium-Sim/thorium-nova/blob/develop/CONTRIBUTING.md"
				target="_blank"
				rel="noreferrer"
				className="underline text-primary"
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
			} text-right self-end max-h-72 overflow-y-hidden`}
		>
			<div
				className={`${styles["all-credits"]} my-8`}
				style={{ ["--credits-duration" as any]: `${creditList.length * 2}s` }}
			>
				{creditList.map((c, i) => (
					<div key={i} className="text-white py-2">
						<p>{c.header}</p>
						<p className="font-bold text-lg mt-1">{c.content}</p>
					</div>
				))}
				<div className="h-8" />
				{creditList.map((c, i) => (
					<div key={i} className="text-white py-2">
						<p>{c.header}</p>
						<p className="font-bold text-lg mt-1">{c.content}</p>
					</div>
				))}
			</div>
		</div>
	);
};

export default Credits;
