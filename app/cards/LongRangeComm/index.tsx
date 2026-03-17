import { Canvas, useFrame } from "@react-three/fiber";
import type { AppRouter } from "@thorium/.server/init/router";
import {
	lrmStateMap,
	replaceCharacters,
	rotateCharacters,
} from "@thorium/cards/LongRangeComm/events";
import { forwardQuaternion } from "@thorium/cards/Pilot/constants";
import { PlayerArrow } from "@thorium/cards/Pilot/PlayerArrow";
import { PolarGrid } from "@thorium/components/Starmap/PolarGrid";
import { clientId, q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import SearchableInput, {
	DefaultResultLabel,
} from "@thorium/ui/SearchableInput";
import Select from "@thorium/ui/Select";
import SineWave, { getSinePoint } from "@thorium/ui/SineWave";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import type {
	inferProcedureInput,
	inferTransformedProcedureOutput,
} from "@thorium/utils/live-query/.server/types";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { setCursor } from "@thorium/utils/setCursor";
import { fromDate } from "dot-beat-time";
import throttle from "lodash.throttle";
import {
	Suspense,
	useCallback,
	useImperativeHandle,
	useRef,
	useState,
	Activity,
	useMemo,
} from "react";
import { Label, TextArea } from "react-aria-components";
import type { OrthographicCamera } from "three";
import { BufferGeometry, type Group, type Mesh, Path, Vector3 } from "three";

type Pages = "inbox" | "sent" | "compose" | "outbox";
export function LongRangeComm() {
	const [currentPage, setCurrentPage] = useState<Pages>("inbox");

	return (
		<div className="flex gap-4 h-full">
			<Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
			<Activity mode={currentPage === "inbox" ? "visible" : "hidden"}>
				<InboxPage />
			</Activity>
			<Activity mode={currentPage === "compose" ? "visible" : "hidden"}>
				<ComposePage />
			</Activity>
			<Activity mode={currentPage === "sent" ? "visible" : "hidden"}>
				<SentPage />
			</Activity>
			<div
				className={
					currentPage === "outbox"
						? "h-full w-full"
						: "sr-only pointer-events-none"
				}
			>
				<OutboxPage pageLoaded={currentPage === "outbox"} />
			</div>
		</div>
	);
}

function Sidebar({
	currentPage,
	setCurrentPage,
}: {
	currentPage: Pages;
	setCurrentPage: (page: Pages) => void;
}) {
	const { shipId } = useStation();

	const [pendingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		shipId,
		filter: "pending",
	});
	const [encodedMessages] = q.longRangeComm.incomingMessages.useNetRequest({
		shipId,
	});

	const outboxLabel = pendingMessages.length;
	const inboxLabel = encodedMessages.filter((e) => e.unread).length;

	return (
		<div className="flex flex-col items-center gap-4">
			<Tooltip content="Inbox" placement="right">
				<Button
					className={cn("relative btn-round btn-alert", {
						active: currentPage === "inbox",
					})}
					onClick={() => setCurrentPage("inbox")}
				>
					<Icon name="inbox" />
					{inboxLabel > 0 ? (
						<div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 badge badge-error rounded-full">
							{inboxLabel}
						</div>
					) : null}
				</Button>
			</Tooltip>
			<Tooltip content="Compose Message" placement="right">
				<Button
					className={cn("btn-round btn-alert", {
						active: currentPage === "compose",
					})}
					onClick={() => setCurrentPage("compose")}
				>
					<Icon name="pencil-line" />
				</Button>
			</Tooltip>
			<Tooltip content="Outbox" placement="right">
				<Button
					className={cn("relative btn-round btn-alert", {
						active: currentPage === "outbox",
					})}
					onClick={() => setCurrentPage("outbox")}
				>
					<Icon name="archive" />

					{outboxLabel > 0 ? (
						<div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 badge badge-error rounded-full">
							{outboxLabel}
						</div>
					) : null}
				</Button>
			</Tooltip>
			<Tooltip content="Sent" placement="right">
				<Button
					className={cn("btn-round btn-alert", {
						active: currentPage === "sent",
					})}
					onClick={() => setCurrentPage("sent")}
				>
					<Icon name="send" />
				</Button>
			</Tooltip>
		</div>
	);
}

function InboxPage() {
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

function RotationDecoder({
	rotation,
	updateMessageDecoding,
}: {
	rotation: number;
	updateMessageDecoding: (
		decoding: Extract<
			inferProcedureInput<
				AppRouter["longRangeComm"]["updateMessageDecoding"]
			>["decoding"],
			{ type: "rotation" }
		>,
	) => Promise<void>;
}) {
	return (
		<div className="flex flex-col justify-center h-full gap-8">
			<div
				className="grid text-xl"
				style={{
					gridTemplateColumns: `repeat(${rotateCharacters.length}, minmax(0, 1fr))`,
				}}
			>
				<div className="contents">
					{rotateCharacters.split("").map((l) => (
						<span
							key={l}
							className="not-last:border-r border-white/50 text-center"
						>
							{l}
						</span>
					))}
				</div>
				<div className="contents">
					{(
						rotateCharacters.slice(rotation) +
						rotateCharacters.slice(0, rotation)
					)
						.split("")
						.map((l) => (
							<span
								key={l}
								className="not-last:border-r border-white/50 text-center"
							>
								{l}
							</span>
						))}
				</div>
			</div>
			<input
				type="range"
				className="range range-primary range-xl w-full"
				min={0}
				max={rotateCharacters.length - 1}
				step={1}
				value={rotateCharacters.length - rotation}
				onInput={async (event) =>
					updateMessageDecoding({
						type: "rotation",
						rotation:
							rotateCharacters.length - Number(event.currentTarget.value),
					})
				}
			/>
		</div>
	);
}

function ReplacementDecoder({
	letterMap,
	updateMessageDecoding,
}: {
	letterMap: string;
	updateMessageDecoding: (
		decoding: Extract<
			inferProcedureInput<
				AppRouter["longRangeComm"]["updateMessageDecoding"]
			>["decoding"],
			{ type: "replacement" }
		>,
	) => Promise<void>;
}) {
	return (
		<div className="grid grid-cols-9 grid-rows-4 grid-flow-col-dense items-center h-full gap-8 py-4">
			{replaceCharacters.split("").map((l, i) => (
				<div key={l} className="flex gap-2">
					<div className="p-2 panel w-[3ch] text-center">{l}</div>
					<input
						className={cn("input w-[3ch] p-2 h-full text-center text-base", {
							"input-error":
								letterMap.indexOf(letterMap[i]) !==
								letterMap.lastIndexOf(letterMap[i]),
							"input-alert":
								letterMap.indexOf(letterMap[i]) ===
								letterMap.lastIndexOf(letterMap[i]),
						})}
						defaultValue={letterMap[i]}
						maxLength={1}
						onChange={(event) => {
							const newLetterMap = letterMap.split("");
							const newChar = event.currentTarget.value
								.slice(0, 1)
								.toLowerCase()
								.trim();
							if (newChar) {
								newLetterMap[i] = newChar;
								updateMessageDecoding({
									type: "replacement",
									letterMap: newLetterMap
										.slice(0, replaceCharacters.length)
										.join(""),
								});
							}
						}}
					/>
				</div>
			))}
		</div>
	);
}

function WavesDecoder({
	waves,
	updateMessageDecoding,
}: {
	waves: {
		amplitude: number;
		frequency: number;
		phase: number;
		requiredAmplitude: number;
		requiredFrequency: number;
		requiredPhase: number;
	}[];
	updateMessageDecoding: (
		decoding: Extract<
			inferProcedureInput<
				AppRouter["longRangeComm"]["updateMessageDecoding"]
			>["decoding"],
			{ type: "waves" }
		>,
	) => Promise<void>;
}) {
	const waveWidthPercent = 0.25;
	const waveAnimationRef = useRef(0);
	const [selectedWaveIndex, setSelectedWave] = useState(0);
	const selectedWave = waves[selectedWaveIndex];

	return (
		<div className="py-4 h-full grid grid-cols-[auto_1fr] grid-rows-[1fr_auto_auto_auto] gap-2">
			<SineWave
				className="flex-auto col-span-2"
				waves={waves}
				callFrame={(ctx, width, height) => {
					const requiredWaves = waves.map(
						({ requiredAmplitude, requiredFrequency, requiredPhase }) => ({
							amplitude: requiredAmplitude,
							frequency: requiredFrequency,
							phase: requiredPhase,
						}),
					);
					ctx.beginPath();

					for (
						let i = -10 + waveAnimationRef.current;
						i <
						width * window.devicePixelRatio * waveWidthPercent +
							10 +
							waveAnimationRef.current;
						i += 1
					) {
						ctx.lineTo(
							i / 2,
							getSinePoint(i, requiredWaves) * height + height / 2,
						);
					}
					ctx.lineWidth = 1;
					ctx.strokeStyle = "#ffff00";
					ctx.stroke();

					waveAnimationRef.current += 10;
					if (waveAnimationRef.current > width * 2) {
						waveAnimationRef.current = -width * 2 * waveWidthPercent;
					}
				}}
			/>
			<div className="text-right">Frequency:</div>
			<div>
				<input
					type="range"
					className="range range-error"
					value={selectedWave.frequency}
					onInput={(e) => {
						updateMessageDecoding({
							type: "waves",
							waves: waves.map((w, i) =>
								i === selectedWaveIndex
									? { ...w, frequency: Number(e.currentTarget.value) }
									: w,
							),
						});
					}}
				/>
			</div>
			<div className="text-right">Amplitude:</div>
			<div>
				<input
					type="range"
					className="range range-warning"
					value={selectedWave.amplitude}
					min={0}
					max={0.5}
					step={0.01}
					onInput={(e) => {
						updateMessageDecoding({
							type: "waves",
							waves: waves.map((w, i) =>
								i === selectedWaveIndex
									? { ...w, amplitude: Number(e.currentTarget.value) }
									: w,
							),
						});
					}}
				/>
			</div>
			<div className="text-right">Phase:</div>
			<div>
				<input
					type="range"
					className="range range-success"
					value={selectedWave.phase}
					onInput={(e) => {
						updateMessageDecoding({
							type: "waves",
							waves: waves.map((w, i) =>
								i === selectedWaveIndex
									? { ...w, phase: Number(e.currentTarget.value) }
									: w,
							),
						});
					}}
				/>
			</div>
		</div>
	);
}
function OutboxPage({ pageLoaded }: { pageLoaded: boolean }) {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();
	const { interpolate } = useLiveQuery();
	const [longRangeComm] = q.longRangeComm.get.useNetRequest(
		{ shipId },
		{
			callback: (data) => {
				if (draggingRef.current) return;
				setFrequencyValue(data.frequency);
				setGainValue(data.gain);
			},
		},
	);
	const [outgoingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		shipId,
		filter: "pending",
	});

	const draggingRef = useRef(false);
	const [frequency, setFrequencyValue] = useState(
		longRangeComm.frequency || 276.25,
	);
	const [gain, setGainValue] = useState(longRangeComm.gain || 1);
	const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
		null,
	);
	const [selectedSatellite, setSelectedSatellite] = useState<number | null>(
		null,
	);

	const selectedMessage = outgoingMessages.find(
		(m) => m.id === selectedMessageId,
	);

	q.longRangeComm.systemStream.useDataStream({ shipId });

	const powerBarRef = useRef<HTMLDivElement>(null);
	const shadeCountRef = useRef(0);

	const setFrequencyNetSend = useCallback(
		throttle((value: number) => {
			q.longRangeComm.setFrequency.netSend({ shipId, frequency: value });
		}, 100),
		[],
	);
	const setGainNetSend = useCallback(
		throttle((value: number) => {
			q.longRangeComm.setGain.netSend({ shipId, gain: value });
		}, 100),
		[],
	);
	function setFrequency(value: number) {
		setFrequencyValue(value);
		setFrequencyNetSend(value);
	}
	function setGain(value: number) {
		setGainValue(value);
		setGainNetSend(value);
	}

	useAnimationFrame(() => {
		const data = interpolate(longRangeComm.id);
		if (!data || !powerBarRef.current) return;
		const currentPower = data.y;
		powerBarRef.current.style.width = `${(currentPower / longRangeComm.maxSafePower) * 100}%`;
	}, cardLoaded && pageLoaded);

	const scanningTextRef = useRef<HTMLDivElement>(null);
	function updateSatelliteText(text: string) {
		if (scanningTextRef.current) {
			scanningTextRef.current.innerText = text;
		}
	}

	const [encodedMessage, setEncodedMessage] = useRandomCharacterState();

	return (
		<div className="w-full h-full grid grid-cols-[16rem_auto_1fr] overflow-hidden gap-8">
			<div className="flex flex-col h-full row-span-2 min-h-0">
				<h3>Outgoing Messages</h3>
				<ul className="panel panel-alert flex-auto overflow-y-auto">
					{outgoingMessages.map((o) => (
						<li
							key={o.id}
							className={cn("list-group-item cursor-pointer", {
								selected: selectedMessageId === o.id,
							})}
							onClick={() => {
								setSelectedMessageId(o.id);
								setEncodedMessage(o.encodedMessage, o.encodedMessage, true);
							}}
						>
							{o.destinationShipName}
							<small className="block">{o.senderStation}</small>
						</li>
					))}
				</ul>
			</div>
			<SatelliteMap
				className="w-full panel panel-black panel-opaque aspect-square rounded-full"
				radius={gain * longRangeComm.maxSatelliteRange}
				shouldRender={cardLoaded && pageLoaded}
				frequency={frequency}
				updateSatelliteText={updateSatelliteText}
				selectedSatellite={selectedSatellite}
				setSelectedSatellite={setSelectedSatellite}
			/>

			<div className="row-span-2 flex flex-col gap-4 max-h-full  min-h-0">
				<div className="w-full aspect-16/7 panel panel-neutral panel-opaque">
					<SineWave
						className="faded-scroll-x"
						shouldRender={cardLoaded && pageLoaded}
						waves={[
							{
								amplitude: gain * 0.15,
								frequency: frequency / 10,
								phase: Math.PI / 2,
							},
							{
								amplitude: gain * 0.1,
								frequency: (frequency / 100) ** 2,
								phase: Math.PI / 4,
							},
							{
								amplitude: gain * 0.2,
								frequency: (frequency / 50) ** 2,
								phase: Math.PI / 3,
							},
						]}
						callFrame={(ctx, width, height) => {
							const widthDivisor = 4;
							const shadeCount = shadeCountRef.current;
							const shade_grad = ctx.createLinearGradient(
								shadeCount,
								0,
								shadeCount + width / widthDivisor,
								height / widthDivisor,
							);
							shade_grad.addColorStop(0, "rgba(255,255,255,1)");
							shade_grad.addColorStop(0.1, `rgba(255,255,255,${0.5 - gain})`);
							shade_grad.addColorStop(0.9, `rgba(255,255,255,${0.5 - gain})`);
							shade_grad.addColorStop(1, "rgba(255,255,255,1)");

							ctx.fillStyle = shade_grad;
							// new opaque pixels "erase" previous content
							ctx.globalCompositeOperation = "destination-out";
							ctx.fillRect(0, 0, width, height);

							shadeCountRef.current = shadeCount + 3;
							if (shadeCountRef.current > width * 1.2) {
								shadeCountRef.current = -width / widthDivisor;
							}
						}}
					/>
				</div>
				<div>
					<label htmlFor="frequency" className="block">
						Frequency
					</label>
					<input
						id="frequency"
						type="range"
						className="range range-primary w-full block"
						min={100}
						max={350}
						step={0.25}
						dir="rtl"
						value={frequency}
						onPointerDown={() => {
							draggingRef.current = true;
							window.addEventListener(
								"pointerup",
								() => {
									draggingRef.current = false;
								},
								{ once: true },
							);
						}}
						onInput={(e) => setFrequency(Number(e.currentTarget.value))}
					/>
				</div>
				<div>
					<label htmlFor="amplitude" className="block">
						Gain
					</label>
					<input
						id="amplitude"
						type="range"
						className="range range-error w-full block"
						min={0}
						max={1}
						step={0.01}
						value={gain}
						onPointerDown={() => {
							draggingRef.current = true;
							window.addEventListener(
								"pointerup",
								() => {
									draggingRef.current = false;
								},
								{ once: true },
							);
						}}
						onInput={(e) => {
							setGain(
								Math.min(
									Number(e.currentTarget.value),
									(longRangeComm.currentPower - longRangeComm.requiredPower) /
										(longRangeComm.maxSafePower - longRangeComm.requiredPower),
								),
							);
						}}
					/>
				</div>
				<div>
					<p className="whitespace-nowrap">Power Level</p>
					<div className="flex gap-2 h-4">
						<div className="flex-auto w-full panel rounded-none panel-neutral relative overflow-hidden">
							<Tooltip content="Required Power">
								<div
									className="absolute h-full border-green-400 border border-dashed z-10 translate-x-1/2 transition-all"
									style={{
										left: `${(longRangeComm.requiredPower / longRangeComm.maxSafePower) * 100}%`,
									}}
								/>
							</Tooltip>
							<Tooltip content="Alloted Power">
								<div
									className="absolute h-full border-warning border border-dashed z-10 translate-x-1/2 transition-all"
									style={{
										left: `${(longRangeComm.currentPower / longRangeComm.maxSafePower) * 100}%`,
									}}
								/>
							</Tooltip>

							<div
								className="absolute h-full w-1/2 bottom-0  striped-gradient-horizontal striped-gradient-yellow-300 transition-all"
								ref={powerBarRef}
							></div>
						</div>
					</div>
				</div>

				<div className="panel panel-alert p-4 flex-auto whitespace-pre-line overflow-y-auto hyphens-auto wrap-anywhere">
					{encodedMessage}
				</div>
				<Select
					disabled={selectedMessage === null}
					className="select-primary"
					label="Encoding"
					placeholder="Encoding"
					labelHidden
					selected={selectedMessage?.encodingType || "decoded"}
					setSelected={async (value) => {
						if (!value || !selectedMessage?.id) return;
						const { encodedMessage } =
							await q.longRangeComm.setMessageEncoding.netSend({
								messageId: selectedMessage.id,
								encoding: value,
							});
						setEncodedMessage(selectedMessage.message, encodedMessage);
					}}
					items={[
						{
							id: "decoded",
							label: "No Encoding",
						},
						{
							id: "waves",
							label: "Marconi Encoding",
						},
						{
							id: "rotation",
							label: "Haartsen Encoding",
						},
						{
							id: "replacement",
							label: "Lamarr Encoding",
						},
					]}
				/>
				<Button
					className="w-full btn-lg btn-info"
					disabled={!selectedMessage || selectedSatellite === null}
					onClick={() => {
						if (!selectedMessage || selectedSatellite === null) return;
						q.longRangeComm.sendMessage.netSend({
							messageId: selectedMessage.id,
							satelliteId: selectedSatellite,
						});
						setSelectedMessageId(null);
						setEncodedMessage("", "");
					}}
				>
					Send Message
				</Button>
			</div>
			<p
				className="mt-4 text-4xl text-center font-bold col-start-2"
				ref={scanningTextRef}
			>
				Scanning For Satellites
			</p>
		</div>
	);
}

function useRandomCharacterState(defaultMessage: string = "") {
	const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
	const [encodedMessage, setEncodedMessage] = useState(defaultMessage);

	function setMessage(
		previousMessage: string,
		nextMessage: string,
		immediate?: boolean,
	) {
		for (const timeout of timeouts.current) {
			clearTimeout(timeout);
		}
		timeouts.current = [];

		if (immediate || !nextMessage) {
			setEncodedMessage(nextMessage);
			return;
		}

		const randomOrder = Array.from({
			length: nextMessage.length,
		})
			.map((_, i) => i)
			.sort(() => Math.random() - 0.5);
		randomOrder.forEach((index, i) => {
			let message = previousMessage;
			for (let j = 0; j < i; j++) {
				const index = randomOrder[j];
				message =
					message.slice(0, Math.max(index - 1, 0)) +
					nextMessage[index] +
					message.slice(index);
			}
			timeouts.current.push(
				setTimeout(() => {
					setEncodedMessage(message);
				}, 5 * i),
			);
		});
		timeouts.current.push(
			setTimeout(
				() => {
					setEncodedMessage(nextMessage);
				},
				5 * (randomOrder.length + 1),
			),
		);
	}

	return [encodedMessage, setMessage] as const;
}

function SatelliteMap({
	className,
	radius,
	frequency,
	shouldRender,
	updateSatelliteText,
	selectedSatellite,
	setSelectedSatellite,
}: {
	className?: string;
	radius: number;
	frequency: number;
	shouldRender: boolean;
	updateSatelliteText: (text: string) => void;
	selectedSatellite: number | null;
	setSelectedSatellite: (id: number | null) => void;
}) {
	const { shipId } = useStation();

	const [longRangeComm] = q.longRangeComm.get.useNetRequest({ shipId });
	const [commSatellites] = q.longRangeComm.commSatellites.useNetRequest();
	const [playerShip] = q.ship.player.useNetRequest({ clientId });
	// Get the updates of the ship's position
	q.pilot.stream.useDataStream({ systemId: null, shipId });

	const range = longRangeComm.maxSatelliteRange;

	return (
		<div className={className}>
			<Canvas
				onContextMenu={(e) => {
					e.preventDefault();
				}}
				gl={{ antialias: true, logarithmicDepthBuffer: true, alpha: true }}
				orthographic
				camera={{
					position: [0, range * 2, 0],
					left: -range,
					right: range,
					top: range,
					bottom: -range,
					far: range * 2,
					near: 0.01,
				}}
				frameloop={shouldRender ? "always" : "demand"}
				className="rounded-full overflow-hidden"
			>
				<SatelliteView
					gainRadius={radius}
					range={range}
					commSatellites={commSatellites}
					frequency={frequency}
					shipId={shipId}
					systemPosition={playerShip.systemPosition}
					updateSatelliteText={updateSatelliteText}
					selectedSatellite={selectedSatellite}
					setSelectedSatellite={setSelectedSatellite}
				/>
			</Canvas>
		</div>
	);
}

interface CommSatellite {
	id: number;
	position: [number, number, number];
	frequency: number;
}
function SatelliteView({
	gainRadius,
	range,
	commSatellites,
	frequency,
	shipId,
	systemPosition,
	updateSatelliteText,
	selectedSatellite,
	setSelectedSatellite,
}: {
	gainRadius: number;
	range: number;
	commSatellites: CommSatellite[];
	frequency: number;
	shipId: number;
	systemPosition: { x: number; y: number; z: number } | null;
	updateSatelliteText: (text: string) => void;
	selectedSatellite: number | null;
	setSelectedSatellite: (id: number | null) => void;
}) {
	const fixedRef = useRef<Group>(null);
	const relativeRef = useRef<Group>(null);
	const { interpolate } = useLiveQuery();
	const LIGHT_YEAR_TO_LIGHT_MINUTE = 60 * 24 * 365.25;
	const [playerPosition] = useState(new Vector3());
	const [meshes] = useState(new Map());

	const gainRadiusRef = useRef<Mesh>(null);
	const pulseProgress = useRef(0);
	useFrame((props, delta) => {
		pulseProgress.current =
			(pulseProgress.current + (delta * 2) / Math.max(gainRadius, 1)) % 1;
		const sineProgress = Math.sin(pulseProgress.current * Math.PI);
		gainRadiusRef.current?.scale.setScalar(
			gainRadius * (sineProgress > 0 ? sineProgress : 0),
		);
		const gainRadiusMaterial = gainRadiusRef.current?.material;
		if (gainRadiusMaterial && !Array.isArray(gainRadiusMaterial)) {
			gainRadiusMaterial.opacity =
				0.2 * Math.sin(pulseProgress.current * Math.PI + Math.PI / 2);
		}
	});

	useFrame((props, delta) => {
		if (!fixedRef.current) return;
		const playerShip = interpolate(shipId);
		if (!playerShip) return;

		const { x, y, z, r } = playerShip;
		fixedRef.current.position.set(0, 0, 0);
		fixedRef.current.quaternion
			.set(r.x, r.y, r.z, r.w)
			.multiply(forwardQuaternion);

		const camera = props.camera as OrthographicCamera;
		camera.position
			.set(0, range, 0)
			.applyQuaternion(fixedRef.current.quaternion);

		camera.quaternion.set(r.x, r.y, r.z, r.w);
		camera.rotateX(-Math.PI / 2);
		camera.rotateZ(Math.PI);
		if (systemPosition) {
			playerPosition
				.set(systemPosition.x, systemPosition.y, systemPosition.z)
				.multiplyScalar(1 / LIGHT_YEAR_TO_LIGHT_MINUTE);
		} else {
			playerPosition
				.set(x, y, z)
				.multiplyScalar(1 / LIGHT_YEAR_TO_LIGHT_MINUTE);
		}
		relativeRef.current?.position.copy(playerPosition).negate();

		let inRangeSatellites = 0;
		for (const {
			id,
			position,
			frequency: satelliteFrequency,
		} of commSatellites) {
			const shipDistance = Math.hypot(
				playerPosition.x - position[0],
				playerPosition.y - position[1],
				playerPosition.z - position[2],
			);
			const inRange = shipDistance <= gainRadius;
			if (inRange) inRangeSatellites++;
			const frequencyDistance = Math.abs(satelliteFrequency - frequency) / 10;
			const scale = Math.min(
				0.5,
				Math.max((1 - frequencyDistance) * (inRange ? 1 : 0), 0),
			);

			if ((!inRange || frequencyDistance > 0.75) && selectedSatellite === id) {
				setSelectedSatellite(null);
			}
			lerpVector.setScalar(scale);
			const mesh = meshes.get(id);
			mesh?.scale.lerp(lerpVector, 0.1);
		}
		if (inRangeSatellites === 0) {
			updateSatelliteText("Scanning For Satellites...");
		} else {
			updateSatelliteText(
				`${inRangeSatellites} Satellite${inRangeSatellites === 1 ? "" : "s"} Found`,
			);
		}
	});

	const circleGeometry = useMemo(() => {
		const path = new Path();
		path.absarc(0, 0, 1, 0, Math.PI * 2, false);
		const points = path.getPoints(120);
		return new BufferGeometry().setFromPoints(points);
	}, []);
	return (
		<Suspense fallback={null}>
			<group ref={fixedRef}>
				<group scale={[0.5, 0.5, 0.5]}>
					<PlayerArrow />
				</group>

				<mesh scale={0} ref={gainRadiusRef}>
					<sphereGeometry />
					<meshBasicMaterial
						transparent
						opacity={0.2}
						color={0x2288ff}
						depthWrite={false}
					/>
				</mesh>

				<lineLoop
					geometry={circleGeometry}
					rotation={[Math.PI / 2, 0, 0]}
					scale={gainRadius}
				>
					<lineBasicMaterial color={0x2288ff} transparent opacity={0.8} />
				</lineLoop>
				<PolarGrid
					rotation={[0, (2 * Math.PI) / 12, 0]}
					args={[range, 12, range, 64, 0xffffff, 0xffffff]}
				/>
			</group>
			<group ref={relativeRef}>
				{commSatellites.map((c) => (
					<SatelliteDot
						key={c.id}
						{...c}
						ref={(ref) => {
							if (!ref) return;
							meshes.set(ref.id, ref.mesh);
						}}
						selected={c.id === selectedSatellite}
						onClick={() => setSelectedSatellite(c.id)}
					/>
				))}
			</group>
		</Suspense>
	);
}

const lerpVector = new Vector3();
function SatelliteDot({
	id,
	position,
	ref,
	selected,
	onClick,
}: CommSatellite & {
	ref: (params: { id: number; mesh: Mesh }) => void;
	selected: boolean;
	onClick: () => void;
}) {
	const meshRef = useRef<Mesh>(null);

	useImperativeHandle(ref, () => {
		return { id, mesh: meshRef.current! };
	});
	return (
		<mesh
			position={position}
			ref={meshRef}
			scale={[0, 0, 0]}
			onClick={onClick}
			onPointerOver={(e) => {
				setCursor("pointer");
			}}
			onPointerOut={(e) => {
				setCursor("auto");
			}}
		>
			<sphereGeometry args={[0.5]} />
			<meshBasicMaterial
				color={selected ? 0xff8800 : 0xffffff}
				depthWrite={false}
			/>
		</mesh>
	);
}

function ComposePage() {
	const { shipId, station } = useStation();

	const [addressBook] = q.longRangeComm.addressBook.useNetRequest({ shipId });
	const [contactId, setContactId] = useState(-1);
	const [message, setMessage] = useState("");
	return (
		<div className="w-full max-w-xl mx-auto flex flex-col">
			<div className="w-full flex items-center gap-2">
				<Label className="text-xl">To:</Label>
				<SearchableInput
					className="w-full"
					inputClassName="input-lg"
					queryKey="address-book"
					placeholder="Search Address Book"
					getOptions={async ({ queryKey, signal }) => {
						return addressBook;
					}}
					ResultLabel={({ active, result, selected }) => (
						<DefaultResultLabel active={active} selected={selected}>
							<p>{result.name || result.entityName}</p>
						</DefaultResultLabel>
					)}
					selected={addressBook.find((a) => a.id === contactId) || null}
					setSelected={(value) => {
						if (!value) return;
						setContactId(value.id);
					}}
					displayValue={(item) => item?.name || ""}
				/>
			</div>

			<Label className="text-xl mt-4">Message:</Label>
			<TextArea
				className="textarea resize-none flex-1 w-full"
				value={message}
				onChange={(e) => setMessage(e.currentTarget.value)}
			/>
			<div className="flex gap-2 mt-4">
				<Button
					className="flex-1 btn-warning"
					onClick={() => {
						setContactId(-1);
						setMessage("");
					}}
				>
					Clear
				</Button>
				{/* TODO February 18, 2026 - Make this work once we have the concept of files */}
				{/* <Button className="flex-1 btn-info">Attach...</Button> */}
				<Button
					className="flex-1 btn-success"
					onClick={() => {
						q.longRangeComm.composeMessage.netSend({
							senderId: shipId,
							senderStation: station.name,
							destinationId: contactId,
							message,
						});
						setContactId(-1);
						setMessage("");
					}}
				>
					Queue Message
				</Button>
			</div>
		</div>
	);
}

function SentPage() {
	const { shipId } = useStation();
	const [outgoingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		filter: "sent",
		shipId,
	});
	const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
		null,
	);
	const selectedMessage = outgoingMessages.find(
		(o) => o.id === selectedMessageId,
	);
	return (
		<div className="w-full h-full grid grid-cols-[16rem_1fr] gap-8">
			<div className="flex flex-col h-full">
				<h3>Sent Messages</h3>
				<ul className="panel flex-auto">
					{outgoingMessages.map((o) => (
						<li
							key={o.id}
							className={cn("list-group-item cursor-pointer", {
								selected: selectedMessageId === o.id,
							})}
							onClick={() => setSelectedMessageId(o.id)}
						>
							To: {o.destinationShipName}
							<small className="block">From: {o.senderStation}</small>
						</li>
					))}
				</ul>
			</div>
			{selectedMessage ? (
				<div className="grid gap-x-2 gap-y-4 grid-cols-[auto_1fr] grid-rows-[auto_auto_auto_1fr]">
					<p className="text-xl">To:</p>
					<p className="text-xl">{selectedMessage.destinationShipName}</p>
					<p className="text-xl">From:</p>
					<p className="text-xl">{selectedMessage.senderStation}</p>
					<p className="text-xl">State:</p>
					<p className="text-xl">
						{lrmStateMap[selectedMessage.state]}
						{selectedMessage.state === "undelivered" ? (
							<InfoTip>{selectedMessage.failureReason}</InfoTip>
						) : null}
					</p>
					<p className="col-span-2 panel p-4">{selectedMessage.message}</p>
				</div>
			) : null}
		</div>
	);
}
