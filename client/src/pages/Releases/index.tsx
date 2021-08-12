import {Link} from "react-router-dom";
// Uses a Vite plugin to load the actual data
import releaseNotes from "./release-notes.json";

const Releases = () => {
  return (
    <div className="overflow-y-auto h-full">
      <div className="prose lg:prose-xl max-w-prose mx-auto mt-8 ">
        <Link to="/">Go Back</Link>
        <h1>Release Notes</h1>
        <div className="p-8 rounded-box md:mt-16 mb-16 backdrop-filter backdrop-blur backdrop-brightness-50 backdrop-contrast-125">
          <div dangerouslySetInnerHTML={{__html: releaseNotes.data}} />
        </div>
      </div>
    </div>
  );
};
export default Releases;
