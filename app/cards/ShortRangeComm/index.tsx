import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import SineWave from "@thorium/ui/SineWave";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import throttle from "lodash.throttle";
import { Suspense, useCallback, useRef, useState } from "react";
import {
	CircleGrid,
	CircleGridTiltButton,
	GridCanvas,
} from "@thorium/cards/Pilot/CircleGrid";
import { cn } from "@thorium/utils/cn";
import { ObjectData } from "@thorium/cards/Navigation/ObjectDetails";
import {
	CircleGridStoreProvider,
	useCircleGridStore,
} from "@thorium/cards/Pilot/useCircleGridStore";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { PilotZoomSlider } from "@thorium/cards/Pilot/PilotZoomSlider";

export function ShortRangeComm() {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();
	const { interpolate } = useLiveQuery();
	const [shortRangeComm] = q.shortRangeComm.get.useNetRequest(
		{ shipId },
		{
			callback: (data) => {
				if (draggingRef.current) return;
				setFrequencyValue(data.frequency);
				setGainValue(data.gain);
			},
		},
	);

	const [selectedContactId, setSelectedContact] = useState<null | number>(null);
	const draggingRef = useRef(false);
	const [frequency, setFrequencyValue] = useState(
		shortRangeComm.frequency || 276.25,
	);
	const [gain, setGainValue] = useState(shortRangeComm.gain || 1);

	q.longRangeComm.systemStream.useDataStream({ shipId });

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
	const clickRef = useRef(false);

	return (
		<CircleGridStoreProvider zoomMax={shortRangeComm.maxRadius}>
			<div className="w-full h-full grid grid-cols-[1fr_auto_1fr] overflow-hidden gap-8">
				<div className="flex flex-col h-full row-span-2 min-h-0"></div>

				<Suspense fallback={null}>
					<GridCanvas
						shouldRender={cardLoaded}
						onBackgroundClick={() => {
							if (clickRef.current === true) {
								clickRef.current = false;
								return;
							}
							setSelectedContact(null);
						}}
					>
						<CircleGrid>
							<ShortRangeConversationContacts
								selectedContactId={selectedContactId}
							/>
						</CircleGrid>
					</GridCanvas>
				</Suspense>

				<div className="row-span-2 flex flex-col gap-4 max-h-full  min-h-0">
					<div className="panel panel-primary">
						{selectedContactId ? (
							<Suspense
								fallback={<h3 className="text-2xl px-2">Accessing...</h3>}
							>
								<ObjectData objectId={selectedContactId} />
							</Suspense>
						) : (
							<h3 className="text-2xl p-2 text-center">No Object Selected</h3>
						)}
					</div>
					<PilotZoomSlider />
					<CircleGridTiltButton />
					<div className="w-full aspect-16/7 panel panel-neutral panel-opaque">
						<SineWave
							className="faded-scroll-x"
							shouldRender={cardLoaded}
							waves={[
								{
									amplitude: gain * 0.15,
									frequency: frequency / 10,
									phase: Math.PI / 2,
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
										(shortRangeComm.currentPower -
											shortRangeComm.requiredPower) /
											(shortRangeComm.maxSafePower -
												shortRangeComm.requiredPower),
									),
								);
							}}
						/>
					</div>
				</div>
			</div>
		</CircleGridStoreProvider>
	);
}

function ShortRangeConversationContacts({
	selectedContactId,
}: {
	selectedContactId: number | null;
}) {
	const store = useCircleGridStore();
	const tilted = store((store) => store.tilt > 0);
	const useStarmapStore = useGetStarmapStore();
	const systemId = useStarmapStore((store) => store.currentSystem);

	const [conversationContacts] =
		q.shortRangeComm.conversationContacts.useNetRequest({ systemId });

	return (
		<group>
			{conversationContacts.map((c) => (
				<ConversationEntity
					key={`${c.id}-${c.shipId}`}
					{...c}
					isSelected={selectedContactId === c.id}
				/>
			))}
		</group>
	);
}

function ConversationEntity({
	isSelected,
}: {
	id: number;
	frequency: number;
	shipId: number;
	isSelected: boolean;
}) {
	return <group />;
}
