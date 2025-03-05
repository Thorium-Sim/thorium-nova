// @ts-expect-error
import { docs } from "virtual:ecs-component-docs";
import { Fragment } from "react";

export function ECSComponentDocs() {
	console.log(docs);

	return Object.values(docs)
		.sort((a: any, b: any) => (a.component > b.component ? 1 : -1))
		.map((doc) => {
			const typedDoc: {
				component: string;
				comment: string;
				properties: { name: string; comment: string }[];
			} = doc as any;
			return (
				<Fragment key={typedDoc.component}>
					<h3>
						<code>{typedDoc.component}</code>
					</h3>
					<p>{typedDoc.comment}</p>
					<ul>
						{typedDoc.properties.map((p) => (
							<li key={p.name}>
								<code>
									<strong>{p.name}</strong>
								</code>
								: {p.comment}
							</li>
						))}
					</ul>
				</Fragment>
			);
		});
}
