import { DocViewer } from "@thorium/cards/Documents/DocViewer";
import { clientId, q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import { useStation } from "@thorium/routes/station/useStation";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { cn } from "@thorium/utils/cn";
import { useState } from "react";
import {
	Button as RAButton,
	DialogTrigger,
	Modal,
	Dialog,
	ModalOverlay,
} from "react-aria-components";

export function Documents() {
	const { shipId } = useStation();
	const [documents] = q.documents.get.useNetRequest({ shipId });
	const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
	const doc = documents.find((d) => d.id === selectedDoc);
	const { isWidget } = useCardContext();

	function selectDoc(docId: number) {
		setSelectedDoc(docId);
		q.thorium.genericEvent.netSend({
			clientId,
			eventName: "document-selected",
			properties: `${docId}`,
		});
	}
	return (
		<div className="grid h-screen max-h-full grid-cols-5 overflow-hidden">
			<div className="flex h-full min-h-0 flex-col">
				<ul className="overflow-y documents-list flex-1">
					{documents.map((doc) => (
						<li
							key={doc.id}
							className={cn(
								"list-group-item list-group-item-small flex justify-between items-center",
								{
									selected: selectedDoc === doc.id,
								},
							)}
							onClick={() => selectDoc(doc.id)}
						>
							{doc.name}
						</li>
					))}
				</ul>
			</div>
			<div className="document-viewer relative col-span-4 overflow-hidden">
				{doc ? (
					<>
						<DocViewer {...doc} />
						{isWidget ? (
							<DialogTrigger>
								<RAButton className="btn btn-info btn-sm absolute right-2 bottom-2 z-10">
									Full Size
								</RAButton>
								<ModalOverlay
									className={cn(
										"fixed inset-0 z-[100001] overflow-y-auto bg-black/40 flex min-h-full w-full items-center justify-center p-4 backdrop-blur overflow-hidden",
										"transition-all duration-200 data-[entering]:opacity-0 data-[exiting]:opacity-0",
									)}
								>
									<Modal className={cn("theme-container", popoverTransitionClasses)}>
										<Dialog className="panel panel-alert m:w-full z-30 mx-8 inline-block h-screen max-h-full w-screen max-w-full transform rounded-lg px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all outline-none sm:my-8 sm:p-6 sm:align-middle">
											<DocViewer {...doc} />
											<RAButton
												slot="close"
												className="btn btn-info btn-sm absolute right-2 bottom-2 z-10"
											>
												Close
											</RAButton>
										</Dialog>
									</Modal>
								</ModalOverlay>
							</DialogTrigger>
						) : null}
					</>
				) : null}
			</div>
		</div>
	);
}
