import type { AppRouter } from "@thorium/.server/init/router";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { cn } from "@thorium/utils/cn";
import type {
	inferProcedureInput,
} from "@thorium/utils/live-query/.server/types";
import { fromDate } from "dot-beat-time";
import { useMemo, useRef, useState } from "react";
import { ReplacementDecoder } from "./ReplacementDecoder";
import { RotationDecoder } from "./RotationDecoder";
import { WavesDecoder } from "./WavesDecoder";
import { useRandomCharacterState } from "./useRandomCharacterState";

export function InboxPage() {
	const { shipId } = useStation();
	const [incomingMessages] = q.longRangeComm.incomingMessages.useNetRequest({
		shipId,
	});

	const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
		null,
	);
	const selectedMessage = incomingMessages.find(
		(s) => s.id === selectedMessageId,
	);
	const selectedIsIntercepted =
		selectedMessage && selectedMessage.destinationId !== shipId;

	const [encodedMessage, setEncodedMessage] = useRandomCharacterState(
		selectedMessage?.encodedMessage || "",
	);

	const [localDecoding, setLocalDecoding] = useState<
		| inferProcedureInput<
				AppRouter["longRangeComm"]["updateMessageDecoding"]
		  >["decoding"]
		| undefined
	>(selectedMessage?.encoding);

	const messageDecodingAbortController = useRef(new AbortController());
	const updateMessageDecoding = useMemo(
		() =>
			async (
				messageId: number,
				decoding: inferProcedureInput<
					AppRouter["longRangeComm"]["updateMessageDecoding"]
				>["decoding"],
			) => {
				messageDecodingAbortController.current.abort();
				messageDecodingAbortController.current = new AbortController();
				const { encodedMessage: newMessage } =
					await q.longRangeComm.updateMessageDecoding.netSend(
						{
							messageId,
							decoding,
						},
						{ signal: messageDecodingAbortController.current.signal },
					);

				return newMessage;
			},
		[],
	);

	return (
		<div className="w-full h-full grid grid-cols-[16rem_1fr] grid-rows-[minmax(0,1fr)_minmax(0,1fr)_auto] overflow-hidden gap-8">
			<div className="flex flex-col h-full row-span-3 min-h-0">
				<h3>Incoming Messages</h3>
				<ul className="panel panel-alert flex-auto overflow-y-auto">
					{incomingMessages.map((m) => {
						const isIntercepted = m.destinationId !== shipId;
						return (
							<li
								key={m.id}
								className={cn(
									"list-group-item cursor-pointer flex items-center relative",
									{
										selected: selectedMessageId === m.id,
										"border-error": isIntercepted,
									},
								)}
								onClick={() => {
									setSelectedMessageId(m.id);
									const selectedMessage = incomingMessages.find(
										(s) => s.id === m.id,
									);
									const message = selectedMessage?.encodedMessage || "";
									setEncodedMessage(message, message, true);
									setLocalDecoding(selectedMessage?.encoding);
									q.longRangeComm.updateMessageDecoding.netSend({
										messageId: m.id,
										decoding: m.encoding,
									});
								}}
							>
								{m.unread ? (
									<span className="w-2 h-2 p-0 bg-blue-500 rounded-full absolute top-1 right-1" />
								) : null}
								<span className="flex-auto block pl-4 py-2">
									{m.senderShipName}
									{isIntercepted ? (
										<small className="block">To: {m.destinationShipName}</small>
									) : null}
								</span>
								<div>{fromDate(new Date(m.timestamp))}</div>
							</li>
						);
					})}
				</ul>
			</div>
			<div>
				{selectedMessage ? (
					localDecoding?.type === "rotation" ? (
						<RotationDecoder
							rotation={localDecoding.rotation}
							updateMessageDecoding={async (decoding) => {
								setLocalDecoding(decoding);
								const newMessage = await updateMessageDecoding(
									selectedMessage.id,
									decoding,
								);
								if (newMessage) {
									setEncodedMessage(encodedMessage, newMessage);
								}
							}}
						/>
					) : localDecoding?.type === "replacement" ? (
						<ReplacementDecoder
							letterMap={localDecoding.letterMap}
							updateMessageDecoding={async (decoding) => {
								setLocalDecoding(decoding);
								const newMessage = await updateMessageDecoding(
									selectedMessage.id,
									decoding,
								);
								if (newMessage) {
									setEncodedMessage(newMessage, newMessage, true);
								}
							}}
						/>
					) : localDecoding?.type === "waves" ? (
						<WavesDecoder
							waves={
								localDecoding.waves as {
									frequency: number;
									amplitude: number;
									phase: number;
									requiredFrequency: number;
									requiredAmplitude: number;
									requiredPhase: number;
								}[]
							}
							updateMessageDecoding={async (decoding) => {
								setLocalDecoding(decoding);
								const newMessage = await updateMessageDecoding(
									selectedMessage.id,
									decoding,
								);
								if (newMessage) {
									setEncodedMessage(newMessage, newMessage, true);
								}
							}}
						/>
					) : null
				) : null}
			</div>
			<div
				className={cn(
					"panel panel-alert w-full p-4 text-lg whitespace-pre-line overflow-y-auto",
					{
						"row-span-2": !selectedIsIntercepted,
					},
				)}
			>
				{encodedMessage}
			</div>
			{selectedIsIntercepted ? (
				<div className="col-start-2 justify-self-end">
					<Button
						className="btn-warning"
						onClick={() => {
							if (!selectedMessageId) return;
							q.longRangeComm.forwardInterceptedMessage.netSend({
								messageId: selectedMessageId,
							});
							setSelectedMessageId(null);
							setEncodedMessage("", "", true);
						}}
					>
						Forward to Destination
					</Button>
				</div>
			) : null}
		</div>
	);
}
