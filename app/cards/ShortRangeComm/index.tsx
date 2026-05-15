import { shortRangeStateMap } from "@thorium/cards/ShortRangeComm/shared";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import SineWave from "@thorium/ui/SineWave";
import { cn } from "@thorium/utils/cn";
import throttle from "lodash.throttle";
import { Suspense, useCallback, useRef, useState } from "react";

const frequencyMin = 100;
const frequencyMax = 350;
const pluralRules = new Intl.PluralRules("en-US");
export function ShortRangeComm() {
	const { shipId, ship } = useStation();
	const { cardLoaded } = useCardContext();
	const [shortRangeComm] = q.shortRangeComm.get.useNetRequest(
		{ shipId },
		{
			callback: (data) => {
				if (draggingRef.current || !data) return;
				setFrequencyValue(data.frequency);
				setGainValue(data.gain);
			},
		},
	);
	const [incomingHails] = q.shortRangeComm.incomingHailConversations.useNetRequest({
		shipId,
	});
	q.shortRangeComm.stream.useDataStream({
		systemId: ship.currentSystem,
	});

	const draggingRef = useRef(false);
	const [frequency, setFrequencyValue] = useState(shortRangeComm?.frequency || 276.25);
	const [gain, setGainValue] = useState(shortRangeComm?.gain || 1);

	const setFrequencyNetSend = useCallback(
		throttle((value: number) => {
			q.shortRangeComm.setFrequency.netSend({ shipId, frequency: value });
		}, 100),
		[],
	);
	const setGainNetSend = useCallback(
		throttle((value: number) => {
			q.shortRangeComm.setGain.netSend({ shipId, gain: value });
		}, 100),
		[],
	);
	const detentRange = 2;
	function snapToDetent(value: number) {
		for (const entity of incomingHails) {
			if (Math.abs(value - entity.frequency) < detentRange) return entity.frequency;
		}
		return value;
	}
	function setFrequency(value: number) {
		// Detent the frequency values
		const snappedValue = snapToDetent(value);
		setFrequencyValue(snappedValue);
		setFrequencyNetSend(snappedValue);
	}
	function setGain(value: number) {
		setGainValue(value);
		setGainNetSend(value);
	}

	if (!shortRangeComm) {
		return "No Short Range Comm System";
	}

	const hailFrequency = incomingHails.find((h) => h.frequency === frequency);
	const { maxRadius, minRadius } = shortRangeComm;
	const gainRadius = minRadius + gain * (maxRadius - minRadius);
	return (
		<div className="grid h-full w-full grid-cols-4 grid-rows-[1fr_auto_auto] gap-8 overflow-hidden">
			<Suspense>
				{incomingHails.length > 0 ? (
					<div className="col-span-3 self-center">
						<h1 className="text-center text-4xl font-bold">
							Status: Incoming{" "}
							{pluralRules.select(incomingHails.length) === "one" ? "Hail" : "Hails"}
						</h1>
						{incomingHails.map((h) => (
							<p key={h.id} className="text-center text-xl">
								{h.hostName} — {h.frequency} MHz
							</p>
						))}
					</div>
				) : shortRangeComm.state === "connected" && shortRangeComm.conversationId ? (
					<Conversation conversationId={shortRangeComm.conversationId} />
				) : (
					<div className="col-span-3 self-center">
						<h1 className="text-center text-4xl font-bold">
							Status: {shortRangeStateMap[shortRangeComm.state]}
						</h1>
					</div>
				)}
			</Suspense>

			<div className="col-span-3">
				<label htmlFor="frequency" className="block tabular-nums">
					Frequency ({frequency.toFixed(2)} MHz)
				</label>
				<div className="relative">
					<input
						id="frequency"
						type="range"
						className="range range-primary block w-full"
						min={100}
						max={350}
						step={0.25}
						value={frequency}
						disabled={shortRangeComm.state !== "idle"}
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
					<div
						className="pointer-events-none absolute top-0 left-0 h-full"
						style={{
							width: `calc(100% - var(--size-selector) * 6)`,
							left: `calc(var(--size-selector) * 2)`,
						}}
					>
						{incomingHails.map((h) => {
							return (
								<div
									key={h.id}
									className="bg-accent absolute top-1/2 h-2 w-2 rounded-full"
									style={{
										left: `${((h.frequency - frequencyMin) / (frequencyMax - frequencyMin)) * 100}%`,
										transform: `translate(calc(-50% + var(--size-selector)), -50%)`,
									}}
								/>
							);
						})}
						{shortRangeComm.state === "connected" ? (
							<div
								className="bg-warning-highlight absolute top-1/2 h-2 w-2 rounded-full"
								style={{
									left: `${((shortRangeComm.frequency - frequencyMin) / (frequencyMax - frequencyMin)) * 100}%`,
									transform: `translate(calc(-50% + var(--size-selector)), -50%)`,
								}}
							/>
						) : null}
					</div>
				</div>
			</div>
			<div className="col-span-3">
				<label htmlFor="amplitude" className="block tabular-nums">
					Gain ({gainRadius.toLocaleString()} km)
				</label>
				<input
					id="amplitude"
					type="range"
					className="range range-error block w-full"
					min={0}
					max={1}
					step={0.001}
					value={gain}
					disabled={shortRangeComm.state !== "idle"}
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
								(shortRangeComm.currentPower - shortRangeComm.requiredPower) /
									(shortRangeComm.maxSafePower - shortRangeComm.requiredPower),
							),
						);
					}}
				/>
			</div>
			<div className="col-start-4 row-span-3 row-start-1 flex h-full flex-col gap-4">
				<div className="panel panel-neutral panel-opaque w-full flex-auto">
					<SineWave
						className="faded-scroll-y"
						shouldRender={cardLoaded}
						waves={[
							{
								amplitude: gain * 0.15 + 0.02,
								frequency: (350 - frequency + 100) / 20,
								phase: Math.PI / 2,
							},
						]}
						orientation="vertical"
						strokeWidth={shortRangeComm.state === "idle" ? 1 : 2}
						color={shortRangeComm.state === "idle" ? "red" : "blue"}
						shouldProgress={shortRangeComm.state === "connected"}
					/>
				</div>
				{shortRangeComm.state === "idle" ? (
					hailFrequency ? (
						<Button
							className="btn-success w-full"
							onClick={() =>
								q.shortRangeComm.connect.netSend({
									shipId,
									conversationId: hailFrequency.id,
								})
							}
						>
							Connect
						</Button>
					) : (
						<Button
							className="btn-info w-full"
							onClick={() => q.shortRangeComm.hail.netSend({ shipId })}
						>
							Hail
						</Button>
					)
				) : shortRangeComm.state === "hailing" ? (
					<Button
						className="btn-warning w-full"
						onClick={() => q.shortRangeComm.disconnect.netSend({ shipId })}
					>
						Cancel Hail
					</Button>
				) : (
					<Button
						className="btn-error w-full"
						onClick={() => q.shortRangeComm.disconnect.netSend({ shipId })}
					>
						Disconnect
					</Button>
				)}
			</div>
		</div>
	);
}

function Conversation({ conversationId }: { conversationId: number }) {
	const { shipId } = useStation();
	const [conversation] = q.conversation.conversation.useNetRequest({
		conversationId,
	});

	const hasSelectedChoice = conversation.currentChoices.some((c) => c.selected);

	return (
		<div className="col-span-3 flex h-full flex-col gap-8 overflow-y-hidden py-8">
			<div
				className="faded-scroll-top flex max-h-3/4 flex-auto flex-col-reverse gap-8 overflow-y-auto pt-32"
				// @ts-expect-error
				style={{ "--fade-distance": "8rem" }}
			>
				{[...conversation.currentDialogue].reverse().map((d) => (
					<div
						key={d.id}
						className={cn("text-balance text-2xl", {
							"text-secondary": shipId === d.speakerId,
						})}
					>
						{d.text}
					</div>
				))}
			</div>
			<div className="flex flex-wrap justify-around gap-4">
				{conversation.currentChoices.flatMap((c) =>
					(c.speakerId === -1 || c.speakerId === shipId) &&
					c.text.split(": ").slice(1).length > 0 ? (
						<Button
							key={c.id}
							className="btn-alert"
							disabled={hasSelectedChoice && !c.selected}
							onClick={() => {
								if (hasSelectedChoice) return;
								q.conversation.selectChoice.netSend({
									shipId,
									conversationId,
									choice: c.text,
								});
							}}
						>
							{c.text.split(": ").slice(1).join(": ")}
						</Button>
					) : null,
				)}
			</div>
		</div>
	);
}
