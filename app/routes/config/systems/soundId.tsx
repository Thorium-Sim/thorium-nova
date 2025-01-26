import { q } from "@thorium/context/AppContext";
import Input from "@thorium/ui/Input";
import { type ReactNode, useContext, useReducer, useState } from "react";
import { Link, useParams } from "react-router";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "./OverrideResetButton";
import { Navigate } from "@thorium/components/Navigate";
import Button from "@thorium/ui/Button";
import type { Sound } from "@thorium/ecs-components/sound";
import { produce, type WritableDraft } from "immer";
import { cn } from "@thorium/utils/cn";
import { RangeInput } from "@thorium/ui/RangeInput";
import InfoTip from "@thorium/ui/InfoTip";
import Checkbox from "@thorium/ui/Checkbox";
import { Icon } from "@thorium/ui/Icon";
import {
	playSound,
	removeAllSounds,
	stopLooping,
} from "@thorium/utils/sounds/playSound";
export default function Sounds() {
	const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());

	const { pluginId, systemId, shipId, sound } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
		sound: string;
	};
	const key = `${systemId}${rekey}`;
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.get.useNetRequest({
		pluginId,
		systemId,
		shipId,
		shipPluginId,
	});

	const soundEffects = system.soundEffects as Record<string, Sound[]>;

	if (!system || !Array.isArray(soundEffects[sound]))
		return <Navigate to={`/config/${pluginId}/systems/${systemId}`} />;
	return (
		<div className="flex flex-col gap-2 mb-2 w-72">
			<div className="flex-1 overflow-y-auto">
				{soundEffects[sound].length === 0 ? (
					<div>No sound effects</div>
				) : (
					soundEffects[sound].map((soundEffect, index) => (
						<SoundConfig
							key={JSON.stringify(soundEffect)}
							index={index}
							sound={soundEffect}
							soundCount={soundEffects[sound].length}
							ambiance={sound === "ambiance"}
						/>
					))
				)}
			</div>
			<UploadButton
				className="btn-success w-full"
				onChange={async (files) => {
					for (const file of files) {
						await q.plugin.systems.addSoundEffect.netSend({
							pluginId,
							systemId,
							shipId,
							shipPluginId,
							file,
							fileName: file.name,
							soundEffect: sound,
						});
					}
				}}
			>
				Add Sound Effect
			</UploadButton>
			<Button
				className="btn-error w-full"
				onClick={() => {
					removeAllSounds();
				}}
			>
				Cancel All Sounds
			</Button>
		</div>
	);
}

function SoundConfig({
	sound,
	index,
	soundCount,
	ambiance,
}: { sound: Sound; index: number; soundCount: number; ambiance?: boolean }) {
	const {
		pluginId,
		systemId,
		shipId,
		sound: soundName,
	} = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
		sound: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);
	const [loopStartError, setLoopStartError] = useState(false);
	const [loopEndError, setLoopEndError] = useState(false);
	const [loopGapError, setLoopGapError] = useState(false);
	const [delayError, setDelayError] = useState(false);
	const [channelError, setChannelError] = useState(false);
	const [isOpen, setIsOpen] = useState(true);

	const [playing, setPlaying] = useState<null | number>(null);

	const [system] = q.plugin.systems.get.useNetRequest({
		pluginId,
		systemId,
		shipId,
		shipPluginId,
	});

	const soundEffects = system.soundEffects as Record<string, Sound[]>;

	async function updateSound(
		updater: (draft: WritableDraft<Record<string, Sound[]>>) => void,
	) {
		await q.plugin.systems.update.netSend({
			pluginId,
			systemId,
			shipId,
			shipPluginId,
			soundEffects: produce(soundEffects, updater),
		});
	}
	return (
		<div className="list-group-item relative">
			{soundCount > 1 ? (
				<Button
					className="absolute right-0 top-0 btn-xs"
					onClick={() => setIsOpen((o) => !o)}
				>
					{isOpen ? (
						<Icon name="chevron-down" />
					) : (
						<Icon name="chevron-right" />
					)}
				</Button>
			) : null}
			<Input
				value={sound.url.split("/").at(-1)}
				readOnly
				label={
					<>
						Sound URL{" "}
						<Button
							disabled={playing !== null}
							className={cn("btn-xs", {
								"btn-success": !playing,
								"btn-warning": playing,
							})}
							onClick={() => {
								const id = Math.random();
								setPlaying(id);
								//@ts-expect-error
								playSound({ id, ...sound, type: "soundEffect" }, () =>
									setPlaying(null),
								);
							}}
						>
							<Icon name="volume-2" />
						</Button>
						{sound.loop ? (
							<Button
								disabled={!playing}
								className="btn-xs btn-warning"
								onClick={() => {
									if (playing) {
										setPlaying(null);
										//@ts-expect-error
										stopLooping(playing);
									}
								}}
							>
								<Icon name="ban" />
							</Button>
						) : null}
					</>
				}
			/>
			{isOpen ? (
				<>
					<RangeInput
						label={
							<>
								Volume Range{" "}
								{ambiance ? (
									<InfoTip>
										Ambiance volume is chosen based on the properties of the
										system playing the ambiance. Eg. Reactors using more power
										use the higher end of the range.
									</InfoTip>
								) : (
									<InfoTip>
										Each time the sound is played it will randomly pick a value
										from within the range.
									</InfoTip>
								)}
							</>
						}
						defaultValue={sound.volume}
						placeholder={["1", "1"]}
						onBlur={(values) =>
							updateSound((draft) => {
								const newValue = [...values].sort() as [number, number];
								draft[soundName][index].volume = newValue;
							})
						}
					/>
					<RangeInput
						label={
							<>
								Playback Rate Range{" "}
								{ambiance ? (
									<InfoTip>
										Ambiance playback rate is chosen based on the properties of
										the system playing the ambiance.
									</InfoTip>
								) : null}
							</>
						}
						defaultValue={sound.playbackRate}
						placeholder={["1", "1"]}
						onBlur={(values) =>
							updateSound((draft) => {
								const newValue = [...values].sort() as [number, number];
								draft[soundName][index].playbackRate = newValue;
							})
						}
					/>
					{!ambiance ? (
						<div>
							<Checkbox
								name="loop"
								checked={sound.loop}
								onChange={(e) =>
									updateSound((draft) => {
										draft[soundName][index].loop = e.target.checked;
									})
								}
								label="Loop"
							/>
						</div>
					) : null}
					{sound.loop && !ambiance ? (
						<>
							<div className="flex gap-2">
								<Input
									className="w-0"
									type="text"
									placeholder="0"
									invalidMessage="Loop start must be a number from 0 to 1"
									defaultValue={sound.loopStart?.toString()}
									isInvalid={loopStartError}
									onChange={() => setLoopStartError(false)}
									onBlur={(e) => {
										if (
											(e.target.value !== "" &&
												Number.isNaN(Number.parseFloat(e.target.value))) ||
											Number.parseFloat(e.target.value) < 0 ||
											Number.parseFloat(e.target.value) > 1
										)
											return setLoopStartError(true);

										updateSound((draft) => {
											draft[soundName][index].loopStart =
												e.target.value === ""
													? null
													: Number.parseFloat(e.target.value);
										});
									}}
									label={
										<>
											Loop Start{" "}
											<InfoTip>
												What point the sound should return to when it loops as a
												percentage of the duration, eg. 0.5 is halfway through
												the sound.
											</InfoTip>
										</>
									}
								/>
								<Input
									className="w-0"
									type="text"
									placeholder="1"
									invalidMessage="Loop end must be a number from 0 to 1"
									defaultValue={sound.loopEnd?.toString()}
									isInvalid={loopEndError}
									onChange={() => setLoopEndError(false)}
									onBlur={(e) => {
										if (
											(e.target.value !== "" &&
												Number.isNaN(Number.parseFloat(e.target.value))) ||
											Number.parseFloat(e.target.value) < 0 ||
											Number.parseFloat(e.target.value) > 1
										)
											return setLoopEndError(true);

										updateSound((draft) => {
											draft[soundName][index].loopEnd =
												e.target.value === ""
													? null
													: Number.parseFloat(e.target.value);
										});
									}}
									label={
										<>
											Loop End{" "}
											<InfoTip>
												What point the sound should loop at as a percentage of
												the duration, eg. 0.5 is halfway through the sound.
											</InfoTip>
										</>
									}
								/>
							</div>
							<Input
								type="text"
								placeholder="0"
								invalidMessage="Loop gap must be a number greater than or equal to 0"
								defaultValue={sound.loopGap?.toString()}
								isInvalid={loopGapError}
								onChange={() => setLoopGapError(false)}
								onBlur={(e) => {
									if (
										(e.target.value !== "" &&
											Number.isNaN(Number.parseFloat(e.target.value))) ||
										Number.parseFloat(e.target.value) < 0
									)
										return setLoopGapError(true);

									updateSound((draft) => {
										draft[soundName][index].loopGap =
											e.target.value === ""
												? 0
												: Number.parseFloat(e.target.value);
									});
								}}
								label={
									<>
										Loop Gap{" "}
										<InfoTip>
											How long to wait between loops of the sound in seconds.
										</InfoTip>
									</>
								}
							/>
						</>
					) : null}
					{!ambiance ? (
						<Input
							type="text"
							placeholder="0"
							invalidMessage="Delay must be a number greater than or equal to 0"
							defaultValue={sound.delay?.toString()}
							isInvalid={delayError}
							onChange={() => setDelayError(false)}
							onBlur={(e) => {
								if (
									(e.target.value !== "" &&
										Number.isNaN(Number.parseFloat(e.target.value))) ||
									Number.parseFloat(e.target.value) < 0
								)
									return setDelayError(true);

								updateSound((draft) => {
									draft[soundName][index].delay =
										e.target.value === ""
											? 0
											: Number.parseFloat(e.target.value);
								});
							}}
							label={
								<>
									Delay{" "}
									<InfoTip>
										How long to wait before playing the sound in seconds.
									</InfoTip>
								</>
							}
						/>
					) : null}
					<Input
						type="text"
						placeholder="0,1"
						invalidMessage="Invalid channel format. Channel must be a list of numbers representing the channels the sound will play on."
						defaultValue={sound.channel?.join(",")?.toString()}
						isInvalid={channelError}
						onChange={() => setChannelError(false)}
						onBlur={(e) => {
							if (e.target.value.trim() === "") {
								return updateSound((draft) => {
									draft[soundName][index].channel = null;
								});
							}
							const channels = e.target.value
								.trim()
								.replace(" ", "")
								.split(",")
								.map(Number);
							if (channels.some(Number.isNaN)) return setChannelError(true);
							if (channels.some((channel) => channel < 0))
								return setChannelError(true);
							updateSound((draft) => {
								draft[soundName][index].channel = channels;
							});
						}}
						label={
							<>
								Channels (Advanced)
								<InfoTip>
									Which audio channels the sound should play on, numerical and
									separated by commas. Leave blank to leave the sound's channels
									unchanged. If set, the sound is downmixed to the number of
									channels. If the sound is stereo and just one channel is set,
									the channels are mixed to mono. If the sound is mono and two
									channels are set, the sound is copied to both channels. If the
									number of channels specified is the same as the channels in
									the sound, the channels of the sound are copied to the
									specified channels. Otherwise the sound is mixed to mono and
									copied to the specified channels.
								</InfoTip>
							</>
						}
					/>
					<div className="px-2 pb-2">
						<Button
							className="btn-error btn-sm w-full "
							onClick={() => {
								updateSound((draft) => {
									draft[soundName].splice(index, 1);
								});
							}}
						>
							Remove Sound
						</Button>
					</div>
				</>
			) : null}
		</div>
	);
}

function UploadButton({
	disabled,
	accept,
	onChange = (files) => {},
	children,
	className,
}: {
	disabled?: boolean;
	accept?: string;
	onChange?: (files: FileList) => void;
	children?: ReactNode;
	className?: string;
}) {
	const [dragging, setDragging] = useState(false);

	// Drag and drop is hard to test
	/* istanbul ignore next */
	function handleDragEnter(e: React.DragEvent) {
		if (disabled) return;
		e.preventDefault();
		e.stopPropagation();
		const acceptMatch = !accept || e.dataTransfer.items[0].type.match(accept);
		if (e.dataTransfer.items?.length === 1 && acceptMatch) {
			setDragging(true);
			e.dataTransfer.dropEffect = "copy";
		} else {
			setDragging(false);
			e.dataTransfer.dropEffect = "none";
		}
	}
	/* istanbul ignore next */
	function handleDragExit(e: React.DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		setDragging(false);
	}
	/* istanbul ignore next */
	function handleDrop(e: React.DragEvent) {
		const acceptMatch = !accept || e.dataTransfer.items[0].type.match(accept);

		if (disabled || !acceptMatch) return;
		setDragging(false);
		const files = e.dataTransfer.files;
		if (files?.length === 1) {
			onChange(files);
		}
	}

	return (
		<label
			className={cn("btn", { "brightness-125": dragging }, className)}
			onDragEnter={handleDragEnter}
			onDragOver={handleDragEnter}
			onDragLeave={handleDragExit}
			onDragEnd={handleDragExit}
			onDrop={handleDrop}
		>
			{children}
			<input
				type="file"
				hidden
				accept={accept}
				multiple={false}
				value={""}
				onChange={(e) => {
					if (e.target?.files?.length === 1) {
						onChange(e.target.files);
					}
				}}
			/>
		</label>
	);
}
