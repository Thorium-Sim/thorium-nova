import {
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
	type RefObject,
} from "react";
import stars from "./stars.avif?url";
import { cn } from "@thorium/utils/cn";
import Input from "@thorium/ui/Input";
import Button from "@thorium/ui/Button";
import { useStation } from "@thorium/routes/station/useStation";
import { q } from "@thorium/context/AppContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import Keypad from "@thorium/cards/Legacy/Navigation/Keypad";
import { useCardContext } from "@thorium/context/CardContext";
export function LegacyNavigation() {
	const { shipId } = useStation();
	const { cardLoaded } = useCardContext();

	const [navigation] = q.legacy.navigation.navigation.useNetRequest(
		{ shipId },
		{
			callback(data) {
				if (!data.scanning) {
					if (xRef.current) {
						xRef.current.innerText = data.calculatedCourse.x || "\u00a0";
					}
					setTimeout(() => {
						if (yRef.current) {
							yRef.current.innerText = data.calculatedCourse.y || "\u00a0";
						}
					}, 200);
					setTimeout(() => {
						if (zRef.current) {
							zRef.current.innerText = data.calculatedCourse.z || "\u00a0";
						}
					}, 400);
				}
			},
		},
	);

	const xRef = useRef<HTMLParagraphElement>(null);
	const yRef = useRef<HTMLParagraphElement>(null);
	const zRef = useRef<HTMLParagraphElement>(null);

	const [selectedField, setSelectedField] = useState<"x" | "y" | "z" | null>(
		null,
	);
	const [enteredCourse, setEnteredCourse] = useState(navigation.currentCourse);

	const scannerRef = useRef<{ scan: () => void }>(null);

	useAnimationFrame(() => {
		if (xRef.current && yRef.current && zRef.current) {
			xRef.current.innerText = navigation.thrusters
				? `${Math.round(Math.random() * 360)}˚`
				: `${(Math.round(Math.random() * 100000) / 100).toFixed(2)}`;
			yRef.current.innerText = navigation.thrusters
				? `${Math.round(Math.random() * 360)}˚`
				: `${(Math.round(Math.random() * 100000) / 100).toFixed(2)}`;
			zRef.current.innerText = navigation.thrusters
				? `${Math.round(Math.random() * 360)}˚`
				: `${(Math.round(Math.random() * 100000) / 100).toFixed(2)}`;
		}
	}, navigation.scanning && cardLoaded);
	return (
		<div className="h-full grid grid-cols-5 gap-8">
			<div className="flex flex-col gap-8 col-span-2">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						if (event.currentTarget.destination.value) {
							q.legacy.navigation.scanForCourse.netSend({
								shipId,
								destination: event.currentTarget.destination.value,
							});
						}
					}}
				>
					<Input
						name="destination"
						label="Desired Destination"
						className="no-keypad"
						defaultValue={navigation.destination || ""}
						disabled={navigation.scanning}
						inputButton={
							navigation.scanning ? (
								<Button
									type="button"
									className="btn-sm btn-error"
									onClick={async () => {
										q.legacy.navigation.cancelScan.netSend({ shipId });
									}}
								>
									Cancel Calculation
								</Button>
							) : (
								<Button type="submit" className="btn-alert btn-sm">
									Calculate Coordinates
								</Button>
							)
						}
					/>
				</form>
				<Scanner
					ref={scannerRef}
					scanning={navigation.scanning}
					className="flex-1 panel panel-alert"
				/>
			</div>
			<div className="flex flex-col h-full justify-around">
				{navigation.calculate ? (
					<div className="row-span-2 panel panel p-4 grid grid-cols-[auto_1fr] items-center gap-4">
						<p className="text-xl font-bold col-span-2">Calculated Course</p>
						<p className="text-right">{navigation.thrusters ? "Yaw:" : "X:"}</p>
						<p
							className="text-xl text-center p-2 panel panel-alert tabular-nums"
							ref={xRef}
						>
							{navigation.calculatedCourse.x}
							<span>&nbsp;</span>
						</p>
						<p>{navigation.thrusters ? "Pitch:" : "Y:"}</p>
						<p
							className="text-xl text-center p-2 panel panel-alert tabular-nums"
							ref={yRef}
						>
							{navigation.calculatedCourse.y}
							<span>&nbsp;</span>
						</p>
						<p>{navigation.thrusters ? "Roll:" : "Z:"}</p>
						<p
							className="text-xl text-center p-2 panel panel-alert tabular-nums"
							ref={zRef}
						>
							{navigation.calculatedCourse.z}
							<span>&nbsp;</span>
						</p>
					</div>
				) : null}
				{navigation.thrusters ? null : (
					<div className="row-span-2 panel panel p-4 grid grid-cols-[auto_1fr] items-center gap-4">
						<p className="text-xl font-bold col-span-2">Current Course</p>
						<p className="text-right">X:</p>
						<p
							className={cn(
								"text-xl text-center p-2 panel panel-alert tabular-nums",
								{ "brightness-200": selectedField === "x" },
							)}
						>
							{enteredCourse.x}&nbsp;
						</p>
						<p>Y:</p>
						<p
							className={cn(
								"text-xl text-center p-2 panel panel-alert tabular-nums",
								{ "brightness-200": selectedField === "y" },
							)}
						>
							{enteredCourse.y}&nbsp;
						</p>
						<p>Z:</p>
						<p
							className={cn(
								"text-xl text-center p-2 panel panel-alert tabular-nums",
								{ "brightness-200": selectedField === "z" },
							)}
						>
							{enteredCourse.z}&nbsp;
						</p>
					</div>
				)}
			</div>
			<Keypad
				className="col-span-2"
				keydown={(key) => {
					if (selectedField === null) {
						setSelectedField("x");
						setEnteredCourse((course) => {
							if (key === "." && course.x?.includes(".")) return course;
							return { x: key, y: "", z: "" };
						});
					} else {
						setEnteredCourse((course) => {
							if (key === "." && course[selectedField]?.includes("."))
								return course;
							return {
								...course,
								[selectedField]: `${course[selectedField]}${key}`.slice(0, 10),
							};
						});
					}
				}}
				clear={() => {
					if (selectedField === null || enteredCourse[selectedField] === "") {
						setSelectedField(null);
						setEnteredCourse({ x: "", y: "", z: "" });
					} else {
						setEnteredCourse((course) => ({
							...course,
							[selectedField]: course[selectedField]?.slice(
								0,
								course[selectedField].length - 1,
							),
						}));
					}
				}}
				enter={() => {
					if (selectedField === null) {
						setSelectedField("x");
					} else if (enteredCourse[selectedField] === "") {
						return;
					} else if (selectedField === "z" && enteredCourse.z !== "") {
						q.legacy.navigation.courseSet.netSend({
							shipId,
							newCourse: enteredCourse,
						});
						setSelectedField(null);
						scannerRef.current?.scan();
					} else if (selectedField === "x") {
						setSelectedField("y");
					} else if (selectedField === "y") {
						setSelectedField("z");
					}
				}}
			/>
		</div>
	);
}

function Scanner({
	scanning,
	className,
	ref,
}: {
	scanning: boolean;
	className?: string;
	ref: RefObject<{ scan: () => void } | null>;
}) {
	const [[backX, backY], setBack] = useState([0.5, 0.5]);
	const [[lineX, lineY], setLine] = useState([0.5, 0.5]);
	useEffect(() => {
		if (scanning) {
			setBack([Math.random(), Math.random()]);
			setLine([Math.random(), Math.random()]);
		}
	}, [scanning]);

	useImperativeHandle(ref, () => ({
		scan() {
			setBack([Math.random(), Math.random()]);
			setLine([Math.random(), Math.random()]);
		},
	}));
	return (
		<div
			onTransitionEnd={() => {
				if (scanning) {
					setBack([Math.random(), Math.random()]);
				}
			}}
			className={cn(
				"relative overflow-hidden border border-gray-500",
				className,
			)}
			style={{
				backgroundImage: `url(${stars})`,
				backgroundSize: "150%",
				backgroundPosition: `${backX * 100}% ${backY * 100}%`,
				transition: "background-position 5s linear",
			}}
		>
			<div
				className="absolute w-full h-full transition-transform duration-[5s] ease-linear"
				style={{
					transform: `translate(${lineX * 100}%, 50%)`,
				}}
			>
				<div className="w-1 h-full absolute backdrop-brightness-200 -translate-x-1/2 -translate-y-1/2" />
				<div className="w-px h-full absolute bg-gray-500 -translate-x-1/2 -translate-y-1/2" />
			</div>
			<div
				className="absolute w-full h-full transition-transform duration-[5s] ease-linear"
				style={{
					transform: `translate(50%, ${lineY * 100}%)`,
				}}
			>
				<div className="h-1 w-full absolute backdrop-brightness-200 -translate-x-1/2 -translate-y-1/2" />
				<div className="h-px w-full absolute bg-gray-500 -translate-x-1/2 -translate-y-1/2" />
			</div>
			<div
				className="absolute w-full h-full transition-transform duration-[5s] ease-linear"
				style={{
					transform: `translate(${lineX * 100}%, ${lineY * 100}%)`,
				}}
				onTransitionEnd={(event) => {
					event.stopPropagation();
					if (scanning) {
						setLine([Math.random(), Math.random()]);
					}
				}}
			>
				<div className="relative grid grid-cols-2 gap-4 max-w-fit max-h-fit -translate-x-1/2 -translate-y-1/2">
					<div className="w-4 h-4 border-t-2 border-l-2 rounded-tl-full border-white/30" />
					<div className="w-4 h-4 border-t-2 border-r-2 rounded-tr-full border-white/30" />
					<div className="w-4 h-4 border-b-2 border-l-2 rounded-bl-full border-white/30" />
					<div className="w-4 h-4 border-b-2 border-r-2 rounded-br-full border-white/30" />
				</div>
			</div>
		</div>
	);
}
