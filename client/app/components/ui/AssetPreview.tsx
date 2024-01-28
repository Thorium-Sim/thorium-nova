import {Icon} from "./Icon";

export const AssetPreview: React.FC<{url: string; className?: string}> = ({
  url,
  className,
}) => {
  const ext1 = url.match(/\..{3,4}$/gi);
  const ext = ext1 ? ext1[0].replace(".", "").toLowerCase() : "";
  if (["mov", "mp4", "ogv", "webm", "m4v"].indexOf(ext) > -1) {
    return <Icon name="file-video" className={className} />;
  }
  if (["m4a", "wav", "mp3", "ogg", "aiff", "aif"].indexOf(ext) > -1) {
    return <Icon name="file-audio" className={className} />;
  }
  if (["ttf", "woff", "woff2", "eot"].indexOf(ext) > -1) {
    return <Icon name="file-type" className={className} />;
  }
  if (["pdf"].indexOf(ext) > -1) {
    return <Icon name="file-text" className={className} />;
  }
  return <img alt="object" draggable="false" src={url} className={className} />;
};
