import getStroke from "perfect-freehand";
import { useRef, useState } from "react";

const staticOffset = [0, -15];
export function AnnotationsLayer({
	points,
	onNewAnnotation,
}: {
	points: [number, number, number][][];
	onNewAnnotation: (points: [number, number, number][]) => Promise<void> | void;
}) {
	const offset = useRef({ left: 0, top: 0, height: 1, width: 1 });
	const [currentPoints, setCurrentPoints] = useState<[number, number, number][]>([]);
	return (
		<div className="absolute top-0 left-0 z-30 h-full w-full">
			<svg
				onPointerDown={(event) => {
					const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
					offset.current = { left, top, width, height };
					event.currentTarget.setPointerCapture(event.pointerId);
					setCurrentPoints([
						[
							((event.pageX - left + staticOffset[0]) / width) * 1000,
							((event.pageY - top + staticOffset[1]) / height) * 1000 * (height / width) -
								(height - width) * (width / height),
							event.pressure,
						],
					]);
				}}
				onPointerMove={(e) => {
					if (e.buttons !== 1) return;
					const { left, top, height, width } = offset.current;

					setCurrentPoints([
						...currentPoints,
						[
							((e.pageX - left + staticOffset[0]) / width) * 1000,
							((e.pageY - top + staticOffset[1]) / height) * 1000 * (height / width) -
								(height - width) * (width / height),
							e.pressure,
						],
					]);
				}}
				onPointerUp={async () => {
					await onNewAnnotation(currentPoints);
					setCurrentPoints([]);
				}}
				height="100%"
				width="100%"
				viewBox="0 0 1000 1000"
				className="touch-none"
			>
				<title>Annotations</title>
				{points?.map((p, i) => (
					<path
						key={i}
						className="fill-gray-800"
						d={getSvgPathFromStroke(getStroke(p, { size: 4 }))}
					/>
				))}
				{currentPoints && (
					<path
						className="fill-gray-800"
						d={getSvgPathFromStroke(getStroke(currentPoints, { size: 4 }))}
					/>
				)}
			</svg>
		</div>
	);
}
const average = (a: number, b: number) => (a + b) / 2;
function getSvgPathFromStroke(points: number[][], closed = true) {
	const len = points.length;

	if (len < 4) {
		return ``;
	}

	let a = points[0];
	let b = points[1];
	const c = points[2];

	let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
		2,
	)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`;

	for (let i = 2, max = len - 1; i < max; i++) {
		a = points[i];
		b = points[i + 1];
		result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
	}

	if (closed) {
		result += "Z";
	}

	return result;
}
