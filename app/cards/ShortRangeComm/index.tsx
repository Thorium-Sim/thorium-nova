import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import { useStation } from "@thorium/routes/station/useStation";
import SineWave from "@thorium/ui/SineWave";
import throttle from "lodash.throttle";
import { Suspense, useCallback, useMemo, useRef, useState } from "react";
import {
	CircleGrid,
	CircleGridTiltButton,
	GridCanvas,
} from "@thorium/cards/Pilot/CircleGrid";
import { ObjectData } from "@thorium/cards/Navigation/ObjectDetails";
import {
	CircleGridStoreProvider,
	useCircleGridStore,
} from "@thorium/cards/Pilot/useCircleGridStore";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { PilotZoomSlider } from "@thorium/cards/Pilot/PilotZoomSlider";
import { BufferGeometry, Path } from "three";

export function ShortRangeComm() {
	const { shipId } = useStation();
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

	const [selectedContactId, setSelectedContact] = useState<null | number>(null);
	const draggingRef = useRef(false);
	const [frequency, setFrequencyValue] = useState(
		shortRangeComm?.frequency || 276.25,
	);
	const [gain, setGainValue] = useState(shortRangeComm?.gain || 1);

	const shadeCountRef = useRef(0);

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
	function setFrequency(value: number) {
		setFrequencyValue(value);
		setFrequencyNetSend(value);
	}
	function setGain(value: number) {
		setGainValue(value);
		setGainNetSend(value);
	}
	const clickRef = useRef(false);

	if (!shortRangeComm) {
		return "No Short Range Comm System";
	}

	const gainRadius =
		shortRangeComm.minRadius +
		gain * (shortRangeComm.maxRadius - shortRangeComm.minRadius);
	const { maxRadius, minRadius } = shortRangeComm;
	return (
		<CircleGridStoreProvider
			zoomMin={minRadius}
			zoomMax={maxRadius}
			defaultZoom={(Math.E * 100) / maxRadius}
		>
			<div className="w-full h-full grid grid-cols-[1fr_auto] overflow-hidden gap-8">
				<div className="h-full aspect-square self-center justify-self-center-safe overflow-hidden">
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
							<CircleGrid fixedChildren={<GainRange radius={gainRadius} />}>
								<ShortRangeConversationContacts
									selectedContactId={selectedContactId}
								/>
							</CircleGrid>
						</GridCanvas>
					</Suspense>
				</div>
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
					<div>
						<PilotZoomSlider />
					</div>
					<CircleGridTiltButton />
					<div className="w-full aspect-16/7 panel panel-neutral panel-opaque">
						<SineWave
							className="faded-scroll-x"
							shouldRender={cardLoaded}
							waves={[
								{
									amplitude: gain * 0.15 + 0.02,
									frequency: (350 - frequency + 100) / 20,
									phase: Math.PI / 2,
								},
							]}
						/>
					</div>
					<div>
						<label htmlFor="frequency" className="block tabular-nums">
							Frequency ({frequency.toFixed(2)}MHz)
						</label>
						<input
							id="frequency"
							type="range"
							className="range range-primary w-full block"
							min={100}
							max={350}
							step={0.25}
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
							step={0.001}
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

function GainRange({ radius }: { radius: number }) {
	const circleGeometry = useMemo(() => {
		const path = new Path();
		path.absarc(0, 0, 1, 0, Math.PI * 2, false);
		const points = path.getPoints(120);
		return new BufferGeometry().setFromPoints(points);
	}, []);

	return (
		<>
			<lineLoop
				geometry={circleGeometry}
				rotation={[Math.PI / 2, 0, 0]}
				scale={radius}
			>
				<lineBasicMaterial color={0x2288ff} transparent opacity={0.8} />
			</lineLoop>
			<mesh scale={radius}>
				<sphereGeometry />
				<meshBasicMaterial
					transparent
					opacity={0.2}
					color={0x2288ff}
					depthWrite={false}
				/>
			</mesh>
		</>
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
