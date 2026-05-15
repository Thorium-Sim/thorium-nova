import { Icon } from "@thorium/ui/Icon";
import { Link } from "react-router";

// @ts-expect-error
import Changelog from "../../CHANGELOG.md";

const Releases = () => {
	return (
		<div className="h-full overflow-y-auto">
			<div className="prose lg:prose-base relative mx-auto mt-8 max-w-prose">
				<Link
					to="/"
					className="fixed left-4 z-10 block rounded-full no-underline sm:bg-black/70 sm:px-2 sm:py-1 sm:hover:bg-white/10"
				>
					<Icon name="arrow-left" className="-mt-1 inline" /> Go Back
				</Link>
				<div className="prose-h1:text-xl mb-16 rounded-xl p-8 backdrop-blur backdrop-brightness-[0.25] backdrop-contrast-125 backdrop-filter md:mt-16">
					<Changelog />
				</div>
			</div>
		</div>
	);
};
export default Releases;
