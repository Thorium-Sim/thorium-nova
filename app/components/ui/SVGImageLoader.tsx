import {
	type ComponentPropsWithoutRef,
	forwardRef,
	type Ref,
	useEffect,
	useLayoutEffect,
	useRef,
} from "react";
import { suspend } from "suspend-react";

export function SVGImageLoader({
	url,
	alt,
	ref,
	...props
}: {
	url: string;
	onLoad?: () => void;
	ref?: Ref<HTMLDivElement>;
} & ComponentPropsWithoutRef<"img">) {
	const data = suspend(async () => {
		const res = await fetch(url);
		if (!res.ok) return;
		const data = await res.text();
		if (data.includes("<svg")) {
			return data;
		}
		return null;
	}, [url]);

	const onLoadCallback = useRef(props.onLoad);
	useEffect(() => {
		onLoadCallback.current = props.onLoad;
	}, [props.onLoad]);
	useLayoutEffect(() => {
		if (data) {
			onLoadCallback.current?.();
		}
	}, [data]);
	if (data) {
		return (
			<div
				role="img"
				{...props}
				// biome-ignore lint/security/noDangerouslySetInnerHtml:
				dangerouslySetInnerHTML={{ __html: data }}
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
			// @ts-expect-error
			ref={ref}
		/>
	);
}
