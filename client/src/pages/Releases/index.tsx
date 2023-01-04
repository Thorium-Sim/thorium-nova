import {FaArrowLeft} from "react-icons/fa";
import {Link} from "react-router-dom";
// Uses a Vite plugin to load the actual data
import releaseNotes from "./release-notes.json";

const Releases = () => {
  return (
    <div className="overflow-y-auto h-full">
      <div className="prose lg:prose-base relative max-w-prose mx-auto mt-8 ">
        <Link
          to="/"
          className="fixed block left-4 no-underline z-10 sm:bg-black/70 sm:py-1 sm:px-2 rounded-full sm:hover:bg-white/10"
        >
          <FaArrowLeft className="inline -mt-1" /> Go Back
        </Link>
        <div className="p-8 rounded-box md:mt-16 mb-16 backdrop-filter backdrop-blur backdrop-brightness-50 backdrop-contrast-125 prose-h1:text-xl">
          <div dangerouslySetInnerHTML={{__html: releaseNotes.data}} />
        </div>
      </div>
    </div>
  );
};
export default Releases;
