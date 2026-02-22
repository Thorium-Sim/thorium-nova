import { q } from "@thorium/context/AppContext";
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
import { useRef, useState } from "react";
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
	const [longRangeComm] = q.longRangeComm.get.useNetRequest({ shipId });
	const [outgoingMessages] = q.longRangeComm.outgoingMessages.useNetRequest({
		shipId,
	});
	q.longRangeComm.systemStream.useDataStream({ shipId });

	const powerBarRef = useRef<HTMLDivElement>(null);
	const shadeCountRef = useRef(0);
	const [frequency, setFrequency] = useState(276.25);
	const [amplitude, setAmplitude] = useState(1);

	useAnimationFrame(() => {
		const data = interpolate(longRangeComm.id);
		if (!data || !powerBarRef.current) return;
		const currentPower = data.y;
		powerBarRef.current.style.height = `${(currentPower / longRangeComm.maxSafePower) * 100}%`;
	}, cardLoaded);

	return (
		<div className="flex w-full gap-8">
			<div className="flex-auto">
				<p className="text-4xl text-center font-bold mb-8">
					Scanning For Satellites
				</p>
				<div className="w-full h-56">
					<SineWave
						className="faded-scroll-x"
						waves={[
							{
								amplitude: amplitude * 0.15,
								frequency: frequency / 10,
								phase: Math.PI / 2,
							},
							{
								amplitude: amplitude * 0.1,
								frequency: (frequency / 100) ** 2,
								phase: Math.PI / 4,
							},
							{
								amplitude: amplitude * 0.2,
								frequency: (frequency / 50) ** 2,
								phase: Math.PI / 3,
							},
						]}
						callFrame={(ctx, width, height) => {
							const widthDivisor = 10;
							const shadeCount = shadeCountRef.current;
							const shade_grad = ctx.createLinearGradient(
								shadeCount,
								0,
								shadeCount + width / widthDivisor,
								height / widthDivisor,
							);
							shade_grad.addColorStop(0, "rgba(255,255,255,0.5)");
							shade_grad.addColorStop(0.1, "transparent");
							shade_grad.addColorStop(0.9, "transparent");
							shade_grad.addColorStop(1, "rgba(255,255,255,0.5)");

							ctx.fillStyle = shade_grad;
							// new opaque pixels "erase" previous content
							ctx.globalCompositeOperation = "destination-out";
							ctx.fillRect(0, 0, width, height);

							shadeCountRef.current = shadeCount + 10;
							if (shadeCountRef.current > width) {
								shadeCountRef.current = -width / widthDivisor;
							}
						}}
					/>
				</div>
				<label htmlFor="frequency">Frequency</label>
				<input
					id="frequency"
					type="range"
					className="range range-error text-blue-500"
					min={100}
					max={350}
					step={0.25}
					value={frequency}
					onInput={(e) => setFrequency(Number(e.currentTarget.value))}
				/>
				<label htmlFor="amplitude">Gain</label>
				<input
					id="amplitude"
					type="range"
					className="slider slider-error"
					min={0.01}
					max={1}
					step={0.01}
					value={amplitude}
					onInput={(e) => setAmplitude(Number(e.currentTarget.value))}
				/>
			</div>
			<div className="flex flex-col min-w-32">
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
						className="absolute w-full bottom-0 border-black border-2 bg-yellow-400 h-1/2"
						ref={powerBarRef}
					></div>
				</div>
				<p className="text-center">Power Level</p>
			</div>
		</div>
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
				className="textarea resize-none flex-1"
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
