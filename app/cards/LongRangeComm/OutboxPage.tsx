import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Select from "@thorium/ui/Select";
import SineWave from "@thorium/ui/SineWave";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import throttle from "lodash.throttle";
import { useCallback, useRef, useState } from "react";

import { SatelliteMap } from "./SatelliteMap";
import { useRandomCharacterState } from "./useRandomCharacterState";

export function OutboxPage({ pageLoaded }: { pageLoaded: boolean }) {
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
	const [frequency, setFrequencyValue] = useState(longRangeComm.frequency || 276.25);
	const [gain, setGainValue] = useState(longRangeComm.gain || 1);
	const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
	const [selectedSatellite, setSelectedSatellite] = useState<number | null>(null);

	const selectedMessage = outgoingMessages.find((m) => m.id === selectedMessageId);

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
		<div className="grid h-full w-full grid-cols-[16rem_auto_1fr] gap-8 overflow-hidden">
			<div className="row-span-2 flex h-full min-h-0 flex-col">
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
				className="panel panel-black panel-opaque aspect-square w-full rounded-full"
				radius={gain * longRangeComm.maxSatelliteRange}
				shouldRender={cardLoaded && pageLoaded}
				frequency={frequency}
				updateSatelliteText={updateSatelliteText}
				selectedSatellite={selectedSatellite}
				setSelectedSatellite={setSelectedSatellite}
			/>

			<div className="row-span-2 flex max-h-full min-h-0 flex-col gap-4">
				<div className="panel panel-neutral panel-opaque aspect-16/7 w-full">
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
						className="range range-primary block w-full"
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
						className="range range-error block w-full"
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
					<div className="flex h-4 gap-2">
						<div className="panel panel-neutral relative w-full flex-auto overflow-hidden rounded-none">
							<Tooltip content="Required Power">
								<div
									className="absolute z-10 h-full translate-x-1/2 border border-dashed border-green-400 transition-all"
									style={{
										left: `${(longRangeComm.requiredPower / longRangeComm.maxSafePower) * 100}%`,
									}}
								/>
							</Tooltip>
							<Tooltip content="Alloted Power">
								<div
									className="border-warning absolute z-10 h-full translate-x-1/2 border border-dashed transition-all"
									style={{
										left: `${(longRangeComm.currentPower / longRangeComm.maxSafePower) * 100}%`,
									}}
								/>
							</Tooltip>

							<div
								className="striped-gradient-horizontal striped-gradient-yellow-300 absolute bottom-0 h-full w-1/2 transition-all"
								ref={powerBarRef}
							></div>
						</div>
					</div>
				</div>

				<div className="panel panel-alert flex-auto overflow-y-auto p-4 wrap-anywhere hyphens-auto whitespace-pre-line">
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
						const { encodedMessage } = await q.longRangeComm.setMessageEncoding.netSend({
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
					className="btn-lg btn-info w-full"
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
			<p className="col-start-2 mt-4 text-center text-4xl font-bold" ref={scanningTextRef}>
				Scanning For Satellites
			</p>
		</div>
	);
}
