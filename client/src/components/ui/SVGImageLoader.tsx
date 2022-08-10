import {ComponentPropsWithoutRef, forwardRef} from "react";
import {suspend} from "suspend-react";

export const SVGImageLoader = forwardRef<
  HTMLImageElement,
  {url: string; onLoad?: () => void} & ComponentPropsWithoutRef<"img">
>(function SVGImageLoader({url, alt, ...props}, ref) {
  const data = suspend(async () => {
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.text();
    if (data.includes("<svg")) {
      return data;
    }
    return null;
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
