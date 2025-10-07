import { DocViewer } from "@thorium/cards/Documents/DocViewer";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { FilesMenu } from "@thorium/ui/FilesMenu";
import { Icon } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import { useState } from "react";
import { Button as RAButton } from "react-aria-components";

export function DocumentsCore() {
	const { shipId } = useStation();
	const [documents] = q.documents.get.useNetRequest({ shipId });
	const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
	const [selectedFile, setSelectedFile] = useState<string | undefined>();
	const doc = documents.find((d) => d.id === selectedDoc);

	const prompt = usePrompt();
	return (
		<div className="grid grid-cols-3 h-full overflow-hidden">
			<div className="h-full flex flex-col min-h-0">
				<ul className="flex-1 overflow-y">
					{documents.map((doc) => (
						<li
							key={doc.id}
							className={cn(
								"list-group-item list-group-item-small flex justify-between items-center",
								{
									selected: selectedDoc === doc.id,
								},
							)}
							onClick={() => setSelectedDoc(doc.id)}
						>
							{doc.name}
							<Button
								className="btn-ghost btn-xs"
								onClick={(event) => {
									event.stopPropagation();
									q.documents.removeDocument.netSend({ documentId: doc.id });
								}}
							>
								<Icon name="ban" className="text-red-500" />
							</Button>
						</li>
					))}
				</ul>
				<div className="flex gap-2">
					<FilesMenu
						types={["images", "pdf", "sounds", "videos"]}
						setValue={setSelectedFile}
						value={selectedFile}
						root="Documents"
						canUpload
					>
						<RAButton className="flex-1 btn btn-xs text-left justify-start">
							{selectedFile?.split("/").at(-1) || "Pick File"}
						</RAButton>
					</FilesMenu>
					<Button
						className="btn-xs btn-success flex-1"
						disabled={!selectedFile}
						onClick={async () => {
							if (!selectedFile) return;
							const name = await prompt("What is the name of the document?");
							if (!name) return;
							const { id } = await q.documents.addDocument.netSend({
								shipId,
								name,
								file: selectedFile,
							});
							setSelectedFile(undefined);
							setSelectedDoc(id);
						}}
					>
						Add Document
					</Button>
				</div>
			</div>
			<div className="col-span-2 overflow-hidden relative">
				{doc ? <DocViewer {...doc} /> : null}
			</div>
		</div>
	);
}
