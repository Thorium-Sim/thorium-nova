import {FaFileAudio, FaFileCode, FaFilePdf, FaFileVideo} from "react-icons/fa";

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
    return (
      <FaFileAudio className={className} />
      // <audio className="audio-preview" controls src={object.url} />
    );
  }
  if (["ttf", "woff", "woff2", "eot"].indexOf(ext) > -1) {
    return (
      <FaFileCode className={className} />
      // <audio className="audio-preview" controls src={object.url} />
    );
  }
  if (["pdf"].indexOf(ext) > -1) {
    return <FaFilePdf className={className} />;
  }
  return <img alt="object" draggable="false" src={url} />;
};
