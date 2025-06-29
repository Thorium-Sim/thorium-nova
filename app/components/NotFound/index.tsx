import { Astronaut } from "@thorium/components/NotFound/Astronaut.client";
import { Link } from "react-router";
import { ClientOnly } from "remix-utils/client-only";

export function NoMatch() {
	return (
		<div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none">
			<div className="mx-auto max-w-5xl">
				<ClientOnly>{() => <Astronaut />}</ClientOnly>
				<h1 className="text-5xl font-bold text-center text-white">
					Uh Oh. We're a little lost.
				</h1>
				<h2 className="text-2xl font-bold text-center">
					<Link
						to="/"
						className="text-blue-300 hover:text-blue-500 transition-colors duration-300 drop-shadow-lg filter pointer-events-auto"
					>
						Better head back home.
					</Link>
				</h2>
			</div>
		</div>
	);
}
