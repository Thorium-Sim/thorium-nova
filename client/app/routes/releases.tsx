import changelog from "../../../CHANGELOG.md?raw";
import {Link} from "@remix-run/react";
import {Icon} from "@thorium/ui/Icon";
import markdown from "markdown-it";

const md = markdown();

var defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  var aIndex = tokens[idx].attrIndex("target");

  if (aIndex < 0) {
    tokens[idx].attrPush(["target", "_blank"]); // add new attribute
  } else {
    // @ts-expect-error
    tokens[idx].attrs[aIndex][1] = "_blank"; // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self);
};

const html = md.render(changelog);

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
        <div className="p-8 rounded-box md:mt-16 mb-16 backdrop-filter backdrop-blur backdrop-brightness-50 backdrop-contrast-125 prose-h1:text-xl">
          <div dangerouslySetInnerHTML={{__html: html}} />
        </div>
      </div>
    </div>
  );
};
export default Releases;
