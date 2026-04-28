import * as Cards from "@thorium/cards";
import Menubar from "@thorium/ui/Menubar";
import { Link } from "react-router";

export default function CardsDevelopment() {
	return (
		<Menubar>
			<div className="h-full bg-black/50 p-4 backdrop-blur backdrop-filter">
				<h1 className="mb-4 text-4xl font-bold">Cards Development</h1>
				<div className="flex flex-col flex-wrap items-start gap-2">
					{Object.keys(Cards).map((key) => (
						<Link key={key} to={key} className="btn btn-primary">
							{key}
						</Link>
					))}
				</div>
			</div>
		</Menubar>
	);
}
