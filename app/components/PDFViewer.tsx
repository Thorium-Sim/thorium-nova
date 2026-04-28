import { AnnotationsLayer } from "@thorium/components/AnnotationsLayer";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { useState } from "react";
import { pdfjs } from "react-pdf";
import { Document, Page } from "react-pdf";

import "./PDFViewer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	"pdfjs-dist/build/pdf.worker.min.mjs",
	import.meta.url,
).toString();

export function PDFViewer({
	url,
	annotations,
	onNewAnnotation,
	onClearAnnotations,
}: {
	url: string;
	annotations: [number, number, number][][][];
	onNewAnnotation: (points: [number, number, number][], page: number) => Promise<void>;
	onClearAnnotations: (page: number) => void;
}) {
	const [numPages, setNumPages] = useState<number>();
	const [pageNumber, setPageNumber] = useState<number>(1);

	function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
		setNumPages(numPages);
	}
	const [dims, setDims] = useState({
		height: 0,
		left: 0,
		top: 0,
	});

	return (
		<>
			{annotations[pageNumber - 1] && annotations[pageNumber - 1].length > 0 ? (
				<Button
					className="btn-warning btn-sm absolute top-2 right-2 z-10"
					onClick={() => onClearAnnotations(pageNumber - 1)}
				>
					Clear Annotations
				</Button>
			) : null}

			<div className="pdf-viewer flex h-full min-h-0 flex-col items-center">
				<div
					className="relative flex-1 overflow-hidden"
					ref={(node) => {
						const rect = node?.getBoundingClientRect();
						if (!rect) return;
						if (rect.height !== dims.height || rect.left !== dims.left || rect.top !== dims.top) {
							const { height, left, top } = rect;
							setDims({ height, left, top });
						}
					}}
				>
					{dims.height && (
						<Document file={url} onLoadSuccess={onDocumentLoadSuccess} loading="">
							<Page
								canvasBackground="white"
								pageNumber={pageNumber}
								height={dims.height}
								// width={(dims.height * 8.5) / 11}
							/>
						</Document>
					)}

					<AnnotationsLayer
						points={annotations[pageNumber - 1]}
						onNewAnnotation={async (points) => {
							await onNewAnnotation(points, pageNumber - 1);
						}}
					/>
				</div>
				<div className="flex items-center justify-between gap-4">
					<Button className="btn-sm" onClick={() => setPageNumber((page) => Math.max(1, page - 1))}>
						<Icon name="arrow-left" />
					</Button>
					<span>
						Page {pageNumber} of {numPages}
					</span>
					<Button
						className="btn-sm"
						onClick={() => setPageNumber((page) => Math.min(numPages || 1, page + 1))}
					>
						<Icon name="arrow-right" />
					</Button>
				</div>
			</div>
		</>
	);
}
