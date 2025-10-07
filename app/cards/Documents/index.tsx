import { DocViewer } from "@thorium/cards/Documents/DocViewer";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { cn } from "@thorium/utils/cn";
import { useState } from "react";
import {
	Button as RAButton,
	DialogTrigger,
	Modal,
	Dialog,
	Heading,
	ModalOverlay,
} from "react-aria-components";
import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { useCardContext } from "@thorium/context/CardContext";

export function Documents() {
	const { shipId } = useStation();
	const [documents] = q.documents.get.useNetRequest({ shipId });
	const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
	const doc = documents.find((d) => d.id === selectedDoc);
	const { isWidget } = useCardContext();
	return (
		<div className="grid grid-cols-5 max-h-full h-screen overflow-hidden">
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
						</li>
					))}
				</ul>
			</div>
			<div className="col-span-4 overflow-hidden relative">
				{doc ? (
					<>
						<DocViewer {...doc} />
						{isWidget ? (
							<DialogTrigger>
								<RAButton className="btn btn-info btn-sm absolute bottom-2 right-2 z-10">
									Full Size
								</RAButton>
								<ModalOverlay
									className={cn(
										"fixed inset-0 z-[100001] overflow-y-auto bg-black/40 flex min-h-full w-full items-center justify-center p-4 backdrop-blur overflow-hidden",
										"transition-all duration-200 data-[entering]:opacity-0 data-[exiting]:opacity-0",
									)}
								>
									<Modal
										className={cn("theme-container", popoverTransitionClasses)}
									>
										<Dialog className="z-30 outline-none panel panel-alert inline-block max-w-full max-h-full h-screen w-screen align-bottom rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 sm:align-middle m:w-full sm:p-6 mx-8">
											<DocViewer {...doc} />
											<RAButton
												slot="close"
												className="btn btn-info btn-sm absolute bottom-2 right-2 z-10"
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
