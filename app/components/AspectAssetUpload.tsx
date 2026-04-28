import { useConfirm } from "@thorium/ui/AlertDialog";
import { AssetPreview } from "@thorium/ui/AssetPreview";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import { useCallback, useEffect, useRef, useState } from "react";

export function AspectAssetUpload({
	fileUrls,
	handleUpload,
	remove,
	accept = /(image|font)\/.*/gi,
	acceptString = "image/*, font/*,.ttf,.eot,.woff,.woff2",
	formatCopy,
}: {
	fileUrls: string[];
	handleUpload: (files: FileList) => Promise<void>;
	remove: (file: string) => Promise<void>;
	acceptString?: string;
	accept?: RegExp;
	formatCopy?: (text: string) => string;
}) {
	const [dragging, setDragging] = useState(false);

	// Drag and drop is hard to test
	/* istanbul ignore next */
	function handleDragEnter(e: React.DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		const acceptMatch = !accept || e.dataTransfer.items[0].type.match(accept);

		if (e.dataTransfer.items?.length === 1 && acceptMatch) {
			setDragging(true);
			e.dataTransfer.dropEffect = "copy";
		} else {
			setDragging(false);
			e.dataTransfer.dropEffect = "none";
		}
	}
	/* istanbul ignore next */
	function handleDragExit(e: React.DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		setDragging(false);
	}
	/* istanbul ignore next */
	function handleDrop(e: React.DragEvent) {
		const acceptMatch = !accept || e.dataTransfer.items[0].type.match(accept);

		if (!acceptMatch) return;
		setDragging(false);
		const files = e.dataTransfer.files;
		if (files?.length === 1) {
			handleUpload(files);
		}
	}

	return (
		<>
			<div className="mt-4 flex">
				<h3 className="text-2xl font-bold">Assets</h3>
				<InfoTip>Click on an asset to copy the asset URL to your clipboard.</InfoTip>
			</div>
			<div
				className={`relative flex-1 overflow-y-auto rounded-lg transition-colors ${
					dragging ? "bg-black/80" : "bg-black/50"
				}`}
				onDragEnter={handleDragEnter}
				onDragOver={handleDragEnter}
				onDragLeave={handleDragExit}
				onDragEnd={handleDragExit}
				onDrop={handleDrop}
			>
				{dragging && (
					<div className="pointer-events-none absolute flex h-full w-full items-center justify-center bg-black/50">
						<span className="text-4xl font-bold">Drag file to upload.</span>
					</div>
				)}
				{fileUrls.map((file) => {
					return (
						<UploadedFile
							fileUrl={file}
							key={file}
							remove={() => remove(file)}
							formatCopy={formatCopy}
						/>
					);
				})}
			</div>
			<label className="btn btn-info w-full">
				Upload Asset
				<input
					type="file"
					hidden
					accept={acceptString}
					multiple={true}
					value={""}
					onChange={(e) => {
						if (e.target.files && e.target.files.length > 0) {
							handleUpload(e.target.files);
						}
					}}
				/>
			</label>
		</>
	);
}

const useClipboard = () => {
	const [state, setState] = useState<"idle" | "copied">("idle");
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
	const copy = useCallback(function copy(str: string) {
		const el = Object.assign(document.createElement("textarea"), {
			value: str,
		});
		document.body.appendChild(el);
		el.select();
		document.execCommand("copy");
		document.body.removeChild(el);
		setState("copied");
		timeoutRef.current = setTimeout(() => {
			setState("idle");
		}, 3000);
	}, []);
	useEffect(() => {
		return () => {
			clearTimeout(timeoutRef.current as any);
		};
	}, []);
	return { copy, state };
};

function UploadedFile({
	fileUrl,
	remove,
}: {
	fileUrl: string;
	remove?: () => void | Promise<void>;
	formatCopy?: (text: string) => string;
}) {
	const confirm = useConfirm();
	const { copy, state } = useClipboard();

	return (
		<li key={fileUrl} className="list-group-item" onClick={() => copy(fileUrl)}>
			<div className="flex w-full items-center justify-between">
				<AssetPreview url={fileUrl} className="max-h-8 text-2xl" />
				<span className="mx-2 flex-1 overflow-x-hidden text-ellipsis">
					{state === "copied" ? "Copied!" : fileUrl.split("/")[fileUrl.split("/").length - 1]}
				</span>
				{remove ? (
					<Button
						className="btn-error btn-sm"
						onClick={async () => {
							if (
								await confirm({
									header: "Are you sure you want to remove this asset?",
									body: "The file will be deleted permanently.",
								})
							) {
								remove();
							}
						}}
					>
						<Icon name="ban" />
					</Button>
				) : null}
			</div>
		</li>
	);
}
