import { AnnotationsLayer } from "@thorium/components/AnnotationsLayer";
import { PDFViewer } from "@thorium/components/PDFViewer";
import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import { GlbLivePreview } from "@thorium/ui/FilesMenu";
import { Icon } from "@thorium/ui/Icon";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import { cn } from "@thorium/utils/cn";
import { Suspense, useEffect, useRef, useState } from "react";

export function DocViewer({
	id,
	filePath,
	annotations,
}: {
	id: number;
	filePath: string;
	annotations: [number, number, number][][][];
}) {
	const ext1 = filePath.match(/\..{3,4}$/gi);
	const ext = ext1 ? ext1[0].replace(".", "").toLowerCase() : "";
	switch (ext) {
		case "glb":
		case "gltf":
			return <GlbLivePreview url={filePath} className="w-32 h-32 bg-black" />;
		case "mov":
		case "mp4":
		case "ogv":
		case "webm":
		case "m4v":
			return <VideoPlayer src={filePath} />;
		case "pdf":
			return (
				<PDFViewer
					url={filePath}
					annotations={annotations}
					onNewAnnotation={async (points, page) => {
						await q.documents.addAnnotation.netSend({
							annotation: points,
							documentId: id,
							page,
						});
					}}
					onClearAnnotations={(page) =>
						q.documents.clearAnnotations.netSend({ documentId: id, page })
					}
				/>
			);
		case "m4a":
		case "wav":
		case "mp3":
		case "ogg":
		case "aiff":
		case "aif":
			return <AudioPlayer src={filePath} />;
		case "svg":
			return (
				<Suspense>
					<SVGImageLoader url={filePath} className="w-16 text-white" alt="" />
				</Suspense>
			);
		case "jpg":
		case "jpeg":
		case "png":
		case "apng":
		case "gif":
		case "webp":
		case "avif":
			return (
				<ImagePreview id={id} filePath={filePath} annotations={annotations} />
			);
		default:
			return null;
	}
}
function ImagePreview({
	id,
	filePath,
	annotations,
}: {
	id: number;
	filePath: string;
	annotations: [number, number, number][][][];
}) {
	return (
		<>
			{annotations[0] && annotations[0].length > 0 ? (
				<Button
					className="btn-warning btn-sm absolute top-2 right-2"
					onClick={() =>
						q.documents.clearAnnotations.netSend({ documentId: id, page: 0 })
					}
				>
					Clear Annotations
				</Button>
			) : null}
			<div className="h-full relative w-fit mx-auto">
				<img
					src={filePath}
					draggable={false}
					className="object-cover h-full bg-blue-500"
					alt=""
				/>
				<AnnotationsLayer
					points={annotations[0]}
					onNewAnnotation={async (points) => {
						await q.documents.addAnnotation.netSend({
							annotation: points,
							documentId: id,
							page: 0,
						});
					}}
				/>
			</div>
		</>
	);
}

function AudioPlayer({ src }: { src: string }) {
	const [playing, setPlaying] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);
	return (
		<div className="w-full h-full relative group flex items-center justify-center">
			{/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
			<audio
				src={src}
				ref={audioRef}
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				className="absolute opacity-0"
			/>
			<div
				className={cn(
					"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 backdrop-blur",
				)}
			>
				{playing ? (
					<button onClick={() => audioRef.current?.pause()}>
						<Icon name="pause" className="size-16" />
					</button>
				) : (
					<button
						onClick={() => {
							audioRef.current?.play();
						}}
					>
						<Icon name="play" className="size-16" />
					</button>
				)}
			</div>
		</div>
	);
}
function VideoPlayer({ src }: { src: string }) {
	const [playing, setPlaying] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [buttonShown, setButtonShown] = useState(false);
	const disappearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (disappearRef.current) {
				clearTimeout(disappearRef.current);
			}
		};
	});
	return (
		<div className="w-full h-full relative group flex items-center justify-center">
			{/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
			<video
				ref={videoRef}
				src={src}
				className="max-w-full max-h-full object-contain rounded-lg"
				onPlay={() => setPlaying(true)}
				onPause={() => setPlaying(false)}
				onPointerMove={() => {
					if (disappearRef.current) {
						clearTimeout(disappearRef.current);
					}
					setButtonShown(true);
					if (playing) {
						disappearRef.current = setTimeout(
							() => setButtonShown(false),
							1000,
						);
					}
				}}
				onPointerOut={() => {
					if (disappearRef.current) {
						clearTimeout(disappearRef.current);
					}
					setButtonShown(false);
				}}
			/>
			<div
				className={cn(
					"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 rounded-full bg-black/50 backdrop-blur opacity-0 transition-opacity hover:opacity-100",
					{ "opacity-100": buttonShown || !playing },
				)}
			>
				{playing ? (
					<button onClick={() => videoRef.current?.pause()}>
						<Icon name="pause" className="size-16" />
					</button>
				) : (
					<button
						onClick={() => {
							videoRef.current?.play();
							setButtonShown(false);
						}}
					>
						<Icon name="play" className="size-16" />
					</button>
				)}
			</div>
		</div>
	);
}
