// @ts-expect-error
import Changelog from "../../CHANGELOG.md";
import { Link } from "react-router";
import { Icon } from "@thorium/ui/Icon";

const Releases = () => {
	return (
		<div className="overflow-y-auto h-full">
			<div className="prose lg:prose-base relative max-w-prose mx-auto mt-8 ">
				<Link
					to="/"
					className="fixed block left-4 no-underline z-10 sm:bg-black/70 sm:py-1 sm:px-2 rounded-full sm:hover:bg-white/10"
				>
					<Icon name="arrow-left" className="inline -mt-1" /> Go Back
				</Link>
				<div className="p-8 rounded-xl md:mt-16 mb-16 backdrop-filter backdrop-blur backdrop-brightness-[0.25] backdrop-contrast-125 prose-h1:text-xl">
					<Changelog />
				</div>
			</div>
		</div>
	);
};
export default Releases;
