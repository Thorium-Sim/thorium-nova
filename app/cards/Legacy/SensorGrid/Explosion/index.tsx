import useInterval from "@thorium/hooks/useInterval";
import {
	useState,
	type DetailedHTMLProps,
	type ImgHTMLAttributes,
} from "react";

const frameImports = import.meta.glob("./*.avif", {
	eager: true,
	query: "?url",
});
const frames = Object.values(frameImports)
	.map((u: any) => u.default)
	.sort((a, b) => {
		const aNum = Number(a.replace(/.*frame(.*)\.avif/, "$1"));
		const bNum = Number(b.replace(/.*frame(.*)\.avif/, "$1"));
		return aNum - bNum;
	});
export function Explosion(
	props: DetailedHTMLProps<
		ImgHTMLAttributes<HTMLImageElement>,
		HTMLImageElement
	>,
) {
	const [frame, setFrame] = useState(0);

	useInterval(
		() => {
			setFrame((frame) => frame + 1);
		},
		frame < frames.length - 1 ? 50 : null,
	);

	return <img {...props} src={frames[frame]} draggable={false} alt="" />;
}
