import {
  useState,
  useEffect,
  memo,
  ComponentPropsWithoutRef,
  forwardRef,
} from "react";

export const SVGImageLoader = forwardRef<
  HTMLImageElement,
  {url: string} & ComponentPropsWithoutRef<"img">
>(function SVGImageLoader({url, alt, ...props}, ref) {
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
      <div
        role="img"
        {...props}
        dangerouslySetInnerHTML={{__html: data}}
        ref={ref}
      />
    );
  }
  return (
    <img
      draggable="false"
      alt={alt}
      aria-hidden
      {...props}
      src={url}
      ref={ref}
    />
  );
});
