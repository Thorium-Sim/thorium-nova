import {FaFileAudio, FaFilePdf, FaFileVideo, FaFont} from "react-icons/fa";

export const AssetPreview: React.FC<{url: string; className?: string}> = ({
  url,
  className,
}) => {
  const ext1 = url.match(/\..{3,4}$/gi);
  const ext = ext1 ? ext1[0].replace(".", "").toLowerCase() : "";
  if (["mov", "mp4", "ogv", "webm", "m4v"].indexOf(ext) > -1) {
    return <FaFileVideo className={className} />;
  }
  if (["m4a", "wav", "mp3", "ogg", "aiff", "aif"].indexOf(ext) > -1) {
    return <FaFileAudio className={className} />;
  }
  if (["ttf", "woff", "woff2", "eot"].indexOf(ext) > -1) {
    return <FaFont className={className} />;
  }
  if (["pdf"].indexOf(ext) > -1) {
    return <FaFilePdf className={className} />;
  }
  return <img alt="object" draggable="false" src={url} className={className} />;
};
