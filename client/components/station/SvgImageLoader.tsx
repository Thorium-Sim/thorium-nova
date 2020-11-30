import {useState, useEffect, memo} from "react";

export const SVGImageLoader: React.FC<{url: string; className: string}> = memo(
  ({url, className}) => {
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
      if (url.endsWith(".svg")) {
        loadSvg();
      }
    }, [url]);
    console.log(data, url);
    if (data) {
      return (
        <div className={className} dangerouslySetInnerHTML={{__html: data}} />
      );
    }
    return (
      <img
        draggable="false"
        alt=""
        aria-hidden
        className={className}
        src={url}
      />
    );
  }
);
