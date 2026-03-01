import { Canvas, useFrame } from "@react-three/fiber";
import { forwardQuaternion } from "@thorium/cards/Pilot/constants";
import { PlayerArrow } from "@thorium/cards/Pilot/PlayerArrow";
import { PolarGrid } from "@thorium/components/Starmap/PolarGrid";
import Starfield from "@thorium/components/Starmap/Starfield";
import { clientId, q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import SearchableInput, {
	DefaultResultLabel,
} from "@thorium/ui/SearchableInput";
import Select from "@thorium/ui/Select";
import SineWave from "@thorium/ui/SineWave";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import throttle from "lodash.throttle";
import { Suspense, useCallback, useRef, useState } from "react";
import {
	ComboBox,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	Popover,
	Button as RAButton,
	TextArea,
} from "react-aria-components";
import type { OrthographicCamera } from "three";
import { type Group, Mesh, Vector3 } from "three";

type Pages = "inbox" | "archive" | "sent" | "compose" | "outbox";
export function LongRangeComm() {
	const { shipId } = useStation();
	const [incomingMessages] = q.longRangeComm.incomingMessages.useNetRequest({
		shipId,
	});
	const [outgoingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		shipId,
	});
	const [currentPage, setCurrentPage] = useState<Pages>("outbox");

	let page = <div />;
	switch (currentPage) {
		case "inbox":
			page = <InboxPage />;
			break;
		case "archive":
			page = <ArchivePage />;
			break;
		case "compose":
			page = <ComposePage />;
			break;
		case "sent":
			page = <SentPage />;
			break;
		case "outbox":
			page = <OutboxPage />;
			break;
	}

	return (
		<div className="flex gap-4 h-full">
			<Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
			{page}
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

	const [outgoingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		shipId,
	});

	const outboxLabel = outgoingMessages.filter(
		(f) => f.state === "pending",
	).length;

	return (
		<div className="flex flex-col items-center gap-4">
			<Tooltip content="Inbox" placement="right">
				<Button
					className={cn("btn-round btn-alert", {
						active: currentPage === "inbox",
					})}
					onClick={() => setCurrentPage("inbox")}
				>
					<Icon name="inbox" />
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
			<Tooltip content="Archive" placement="right">
				<Button
					className={cn("btn-round btn-alert", {
						active: currentPage === "archive",
					})}
					onClick={() => setCurrentPage("archive")}
				>
					<Icon name="archive" />
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
					<Icon name="square-arrow-out-up-right" />
					<div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 badge badge-error">
						{outboxLabel}
					</div>
				</Button>
			</Tooltip>
		</div>
	);
}

function InboxPage() {
	return <div></div>;
}
function ArchivePage() {
	return <div></div>;
}
function OutboxPage() {
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
	});

	const draggingRef = useRef(false);
	const [frequency, setFrequencyValue] = useState(
		longRangeComm.frequency || 276.25,
	);
	const [gain, setGainValue] = useState(longRangeComm.gain || 1);

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
		powerBarRef.current.style.height = `${(currentPower / longRangeComm.maxSafePower) * 100}%`;
	}, cardLoaded);

	return (
		<div className="w-full grid grid-cols-[16rem_1fr_auto_4rem] gap-8">
			<div className="panel max-w-64"></div>

			<SatelliteMap
				className="w-full h-full panel panel-black panel-opaque aspect-square rounded-full"
				radius={gain * longRangeComm.maxSatelliteRange}
				shouldRender={cardLoaded}
				frequency={frequency}
			/>

			<div>
				<p className="mt-8 text-4xl text-center font-bold mb-8">
					Scanning For Satellites
				</p>
				<div className="w-full aspect-video panel panel-neutral panel-opaque">
					<SineWave
						className="faded-scroll-x"
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
				<label htmlFor="frequency" className="block mt-4">
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
				<label htmlFor="amplitude" className="block mt-4">
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
					onInput={(e) =>
						setGain(
							Math.min(
								Number(e.currentTarget.value),
								(longRangeComm.currentPower - longRangeComm.requiredPower) /
									(longRangeComm.maxSafePower - longRangeComm.requiredPower),
							),
						)
					}
				/>
			</div>
			<div className="flex flex-col min-w-16">
				<div className="flex-auto w-full border relative overflow-hidden">
					<Tooltip content="Required Power">
						<div
							className="absolute w-full border-success border-2 border-dashed z-10 translate-y-1/2 transition-all"
							style={{
								bottom: `${(longRangeComm.requiredPower / longRangeComm.maxSafePower) * 100}%`,
							}}
						/>
					</Tooltip>
					<Tooltip content="Alloted Power">
						<div
							className="absolute w-full border-warning border-2 border-dashed z-10 translate-y-1/2 transition-all"
							style={{
								bottom: `${(longRangeComm.currentPower / longRangeComm.maxSafePower) * 100}%`,
							}}
						/>
					</Tooltip>

					<div
						className="absolute w-full bottom-0 border-black border-2 striped-gradient striped-yellow h-1/2 transition-all"
						ref={powerBarRef}
					></div>
				</div>
				<p className="text-center">Power Level</p>
			</div>
		</div>
	);
}

function SatelliteMap({
	className,
	radius,
	frequency,
	shouldRender,
}: {
	className?: string;
	radius: number;
	frequency: number;
	shouldRender: boolean;
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
					position: [0, range, 0],
					left: -range,
					right: range,
					top: range,
					bottom: -range,
					far: range * 2,
				}}
				frameloop={shouldRender ? "always" : "demand"}
				className="rounded-full overflow-hidden"
			>
				<SatelliteView
					radius={radius}
					range={range}
					commSatellites={commSatellites}
					frequency={frequency}
					shipId={shipId}
					systemPosition={playerShip.systemPosition}
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
const playerPosition = new Vector3();
function SatelliteView({
	radius,
	range,
	commSatellites,
	frequency,
	shipId,
	systemPosition,
}: {
	radius: number;
	range: number;
	commSatellites: CommSatellite[];
	frequency: number;
	shipId: number;
	systemPosition: { x: number; y: number; z: number } | null;
}) {
	const fixedRef = useRef<Group>(null);
	const relativeRef = useRef<Group>(null);
	const { interpolate } = useLiveQuery();
	const LIGHT_YEAR_TO_LIGHT_MINUTE = 60 * 24 * 365.25;

	useFrame((props) => {
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
			playerPosition.set(systemPosition.x, systemPosition.y, systemPosition.z);
		} else {
			playerPosition.set(x, y, z);
		}
		relativeRef.current?.position.copy(
			playerPosition.multiplyScalar(1 / LIGHT_YEAR_TO_LIGHT_MINUTE).negate(),
		);
	});

	return (
		<Suspense fallback={null}>
			<group ref={fixedRef}>
				<group scale={[0.5, 0.5, 0.5]}>
					<PlayerArrow />
				</group>

				<mesh scale={[radius, radius, radius]}>
					<sphereGeometry />
					<meshBasicMaterial
						transparent
						opacity={0.2}
						color={0x2288ff}
						depthWrite={false}
					/>
				</mesh>

				<PolarGrid
					rotation={[0, (2 * Math.PI) / 12, 0]}
					args={[range, 12, range, 64, 0xffffff, 0xffffff]}
				/>
			</group>
			<group ref={relativeRef}>
				{commSatellites.map((c) => (
					<SatelliteDot key={c.id} {...c} crewFrequency={frequency} />
				))}
			</group>
		</Suspense>
	);
}

function SatelliteDot({
	position,
	frequency,
	crewFrequency,
}: CommSatellite & { crewFrequency: number }) {
	const frequencyDistance = Math.abs(frequency - crewFrequency) / 10;
	const scale = Math.min(0.5, Math.max(1 - frequencyDistance, 0));
	return (
		<mesh position={position} scale={[scale, scale, scale]}>
			<sphereGeometry args={[0.5]} />
			<meshBasicMaterial
				color={0xffffff}
				transparent
				opacity={scale}
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
							<p>{result.name}</p>
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
				<Select
					className="flex-1"
					disabled={message.trim().length === 0 || contactId === -1}
					buttonClassName="btn-success btn"
					label="Queue Message"
					placeholder="Queue Message"
					labelHidden
					selected={null}
					setSelected={(value) => {
						if (!value) return;
						q.longRangeComm.composeMessage.netSend({
							senderId: shipId,
							senderStation: station.name,
							destinationId: contactId,
							message,
							encoding: value,
						});
					}}
					hideIcon
					items={[
						{
							header: "Select Message Encoding",
							items: [
								{
									id: "decoded",
									label: "No Encoding",
								},
								{
									id: "waves",
									label: "Marconi",
								},
								{
									id: "rotation",
									label: "Haartsen",
								},
								{
									id: "replacement",
									label: "Lamarr",
								},
							],
						},
					]}
				/>
			</div>
		</div>
	);
}
function SentPage() {
	return <div></div>;
}
