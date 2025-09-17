import { Icon } from "@thorium/ui/Icon";
import {
	Popover,
	Menu,
	SubmenuTrigger,
	MenuTrigger,
	Button as RAButton,
	MenuSection,
	Header,
} from "react-aria-components";
import {
	popoverClass,
	StyledMenuItem,
} from "@thorium/components/timelineBuilder/AddBlockMenu";
import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import { playSound } from "@thorium/utils/sounds/playSound";
import { cn } from "@thorium/utils/cn";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useShipModel } from "@thorium/components/Starmap/StarmapShip";
import { Suspense, useRef, type ReactNode } from "react";
import type { Group } from "three";
import type { FileOrFolder } from "@thorium/.server/data";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";

export function FilesMenu({
	value,
	setValue,
	pluginId,
	canUpload,
	types,
	children,
	root,
}: {
	value?: string;
	setValue?: (value: string) => void;
	pluginId?: string;
	canUpload?: boolean;
	types: "models" | "sounds" | "videos" | "images" | "pdf";
	children?: ReactNode;
	root?: string;
}) {
	const extensions =
		types === "models"
			? ["glb", "gltf"]
			: types === "videos"
				? ["mov", "mp4", "ogv", "webm", "m4v"]
				: types === "sounds"
					? ["m4a", "wav", "mp3", "ogg", "aiff", "aif"]
					: types === "images"
						? ["svg", "jpg", "jpeg", "png", "apng", "gif", "webp", "avif"]
						: types === "pdf"
							? ["pdf"]
							: undefined;
	const [files] = q.thorium.pluginAssets.useNetRequest({
		pluginId,
		extensions,
	});

	const fileRef = useRef<HTMLInputElement>(null);
	const pickResolve = useRef<(value: File | Promise<File> | null) => void>(
		() => {},
	);

	async function pickFile() {
		const pickPromise = new Promise<File | null>((res) => {
			pickResolve.current = res;
		});
		fileRef.current?.click();
		return await pickPromise;
	}

	return (
		<>
			<MenuTrigger>
				{children || (
					<RAButton className="flex-1 btn btn-sm text-left justify-start w-full">
						{value || "Pick File"}
					</RAButton>
				)}
				<Popover placement="bottom" className={popoverClass}>
					<Menu>
						{Object.entries(files).map(([plugin, files]) => (
							<MenuSection key={plugin}>
								<Header>{plugin}</Header>
								<NestedFilesMenu
									files={
										root
											? files.files.find((file) => file.name === root)
													?.contents || files.files
											: files.files
									}
									onAction={(path) => setValue?.(path)}
									pluginId={plugin}
									pickFile={canUpload ? pickFile : undefined}
									path={
										root
											? files.files.find((file) => file.name === root)
												? `${root}/`
												: undefined
											: undefined
									}
								/>
							</MenuSection>
						))}
					</Menu>
				</Popover>
			</MenuTrigger>
			{canUpload ? (
				<input
					type="file"
					ref={fileRef}
					multiple={false}
					className="w-0 h-0 opacity-0"
					value=""
					onChange={(e) => {
						const file = e.target.files?.[0];
						pickResolve.current?.(file || null);
					}}
				/>
			) : null}
		</>
	);
}

function NestedFilesMenu({
	path = "/",
	files,
	onAction,
	pluginId,
	pickFile,
}: {
	files: FileOrFolder[];
	onAction: (path: string) => void;
	path?: string;
	pluginId: string;
	pickFile?: () => Promise<File | null>;
}) {
	return (
		<>
			{files.map((f) =>
				f.contents ? (
					<SubmenuTrigger key={f.name}>
						<StyledMenuItem className="flex justify-between">
							{f.name} <Icon name="chevron-right" />
						</StyledMenuItem>
						<Popover className={cn(popoverClass, "w-fit")}>
							<Menu>
								<NestedFilesMenu
									path={`${path}${f.name}/`}
									files={f.contents}
									onAction={onAction}
									pluginId={pluginId}
									pickFile={pickFile}
								/>
							</Menu>
						</Popover>
					</SubmenuTrigger>
				) : (
					<StyledMenuItem
						key={f.name}
						onAction={() => onAction(f.fullPath)}
						className="justify-between gap-2"
					>
						<FilePreview url={f.fullPath} />
						{f.name}
					</StyledMenuItem>
				),
			)}
			{pickFile ? (
				<StyledMenuItem
					className="flex justify-between"
					onAction={async () => {
						const asset = await pickFile();
						if (!asset) return;
						await q.thorium.uploadAsset.netSend({
							pluginId,
							assetPath: `${path}${asset.name}`,
							asset,
						});
						onAction(asset.name);
					}}
				>
					Upload File <Icon name="file-up" />
				</StyledMenuItem>
			) : null}
		</>
	);
}

function FilePreview({ url }: { url: string }) {
	const ext1 = url.match(/\..{3,4}$/gi);
	const ext = ext1 ? ext1[0].replace(".", "").toLowerCase() : "";
	switch (ext) {
		case "glb":
		case "gltf":
			return <GlbLivePreview url={url} className="w-32 h-32 bg-black" />;
		case "mov":
		case "mp4":
		case "ogv":
		case "webm":
		case "m4v":
			// biome-ignore lint/a11y/useMediaCaption: <explanation>
			return <video src={url} className="w-32" controls />;
		case "pdf":
			return;
		case "m4a":
		case "wav":
		case "mp3":
		case "ogg":
		case "aiff":
		case "aif":
			return (
				<Button
					className="btn-xs btn-success order-last"
					onPointerUp={(e) => {
						e.preventDefault();
						e.stopPropagation();
						playSound({
							type: "soundEffect",
							id: "test",
							url,
							channel: null,
							delay: 0,
							loop: false,
							loopEnd: null,
							loopGap: 0,
							loopStart: null,
							playbackRate: [1, 1],
							volume: [1, 1],
						});
					}}
				>
					<Icon name="volume-2" />
				</Button>
			);
		case "svg":
			return (
				<Suspense>
					<SVGImageLoader url={url} className="w-16 text-white" alt="" />
				</Suspense>
			);
		case "jpg":
		case "jpeg":
		case "png":
		case "apng":
		case "gif":
		case "webp":
		case "avif":
			return <img src={url} className="w-32 object-cover" alt="" />;
		default:
			return null;
	}
}

function GlbLivePreview({
	url,
	className,
}: { url: string; className?: string }) {
	return (
		<div className={className}>
			<Canvas camera={{ position: [0, 0, 2] }}>
				<ambientLight intensity={0.5} />
				<pointLight position={[0, 0.5, 1.5]} intensity={1} />
				<OrbitControls />
				<Model url={url} />
			</Canvas>
		</div>
	);
}

function Model({ url }: { url: string }) {
	const model = useShipModel(url);
	const ref = useRef<Group>(null);
	useFrame(() => {
		ref.current?.rotateY(0.005);
	});
	if (!model) return null;

	return (
		<group ref={ref}>
			<primitive object={model} />
		</group>
	);
}
