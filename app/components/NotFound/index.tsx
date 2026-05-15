import { Astronaut } from "@thorium/components/NotFound/Astronaut.client";
import { Link } from "react-router";
import { ClientOnly } from "remix-utils/client-only";

export function NoMatch() {
	return (
		<div className="pointer-events-none fixed top-0 right-0 bottom-0 left-0">
			<div className="mx-auto max-w-5xl">
				<ClientOnly>{() => <Astronaut />}</ClientOnly>
				<h1 className="text-center text-5xl font-bold text-white">Uh Oh. We're a little lost.</h1>
				<h2 className="text-center text-2xl font-bold">
					<Link
						to="/"
						className="pointer-events-auto text-blue-300 drop-shadow-lg filter transition-colors duration-300 hover:text-blue-500"
					>
						Better head back home.
					</Link>
				</h2>
			</div>
		</div>
	);
}
