import {useState, useEffect, memo, ComponentPropsWithoutRef} from "react";

export const SVGImageLoader: React.FC<
  {url: string} & ComponentPropsWithoutRef<"img">
> = memo(function SVGImageLoader({url, alt, ...props}) {
  const [data, setData] = useState<string | null>(null);
  useEffect(() => {
    async function loadSvg() {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.text();
      if (data.includes("<svg")) {
        setData(data);
      }
    }
    if (url?.endsWith(".svg")) {
      loadSvg();
    }
  }, [url]);
  if (data) {
    return (
      <div role="img" {...props} dangerouslySetInnerHTML={{__html: data}} />
    );
  }
  return <img draggable="false" alt={alt} aria-hidden {...props} src={url} />;
});
