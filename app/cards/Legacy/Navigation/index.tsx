import Keypad from "@thorium/cards/Legacy/Navigation/Keypad";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Input from "@thorium/ui/Input";
import { cn } from "@thorium/utils/cn";
import { useEffect, useImperativeHandle, useRef, useState, type RefObject } from "react";

import stars from "./stars.avif?url";
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

	const [selectedField, setSelectedField] = useState<"x" | "y" | "z" | null>(null);
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
		<div className="grid h-full grid-cols-5 gap-8">
			<div className="col-span-2 flex flex-col gap-8">
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
					className="panel panel-alert flex-1"
				/>
			</div>
			<div className="flex h-full flex-col justify-around">
				{navigation.calculate ? (
					<div className="panel panel row-span-2 grid grid-cols-[auto_1fr] items-center gap-4 p-4">
						<p className="col-span-2 text-xl font-bold">Calculated Course</p>
						<p className="text-right">{navigation.thrusters ? "Yaw:" : "X:"}</p>
						<p className="panel panel-alert p-2 text-center text-xl tabular-nums" ref={xRef}>
							{navigation.calculatedCourse.x}
							<span>&nbsp;</span>
						</p>
						<p>{navigation.thrusters ? "Pitch:" : "Y:"}</p>
						<p className="panel panel-alert p-2 text-center text-xl tabular-nums" ref={yRef}>
							{navigation.calculatedCourse.y}
							<span>&nbsp;</span>
						</p>
						<p>{navigation.thrusters ? "Roll:" : "Z:"}</p>
						<p className="panel panel-alert p-2 text-center text-xl tabular-nums" ref={zRef}>
							{navigation.calculatedCourse.z}
							<span>&nbsp;</span>
						</p>
					</div>
				) : null}
				{navigation.thrusters ? null : (
					<div className="panel panel row-span-2 grid grid-cols-[auto_1fr] items-center gap-4 p-4">
						<p className="col-span-2 text-xl font-bold">Current Course</p>
						<p className="text-right">X:</p>
						<p
							className={cn("text-xl text-center p-2 panel panel-alert tabular-nums", {
								"brightness-200": selectedField === "x",
							})}
						>
							{enteredCourse.x}&nbsp;
						</p>
						<p>Y:</p>
						<p
							className={cn("text-xl text-center p-2 panel panel-alert tabular-nums", {
								"brightness-200": selectedField === "y",
							})}
						>
							{enteredCourse.y}&nbsp;
						</p>
						<p>Z:</p>
						<p
							className={cn("text-xl text-center p-2 panel panel-alert tabular-nums", {
								"brightness-200": selectedField === "z",
							})}
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
							if (key === "." && course[selectedField]?.includes(".")) return course;
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
							[selectedField]: course[selectedField]?.slice(0, course[selectedField].length - 1),
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
			className={cn("relative overflow-hidden border border-gray-500", className)}
			style={{
				backgroundImage: `url(${stars})`,
				backgroundSize: "150%",
				backgroundPosition: `${backX * 100}% ${backY * 100}%`,
				transition: "background-position 5s linear",
			}}
		>
			<div
				className="absolute h-full w-full transition-transform duration-[5s] ease-linear"
				style={{
					transform: `translate(${lineX * 100}%, 50%)`,
				}}
			>
				<div className="absolute h-full w-1 -translate-x-1/2 -translate-y-1/2 backdrop-brightness-200" />
				<div className="absolute h-full w-px -translate-x-1/2 -translate-y-1/2 bg-gray-500" />
			</div>
			<div
				className="absolute h-full w-full transition-transform duration-[5s] ease-linear"
				style={{
					transform: `translate(50%, ${lineY * 100}%)`,
				}}
			>
				<div className="absolute h-1 w-full -translate-x-1/2 -translate-y-1/2 backdrop-brightness-200" />
				<div className="absolute h-px w-full -translate-x-1/2 -translate-y-1/2 bg-gray-500" />
			</div>
			<div
				className="absolute h-full w-full transition-transform duration-[5s] ease-linear"
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
				<div className="relative grid max-h-fit max-w-fit -translate-x-1/2 -translate-y-1/2 grid-cols-2 gap-4">
					<div className="h-4 w-4 rounded-tl-full border-t-2 border-l-2 border-white/30" />
					<div className="h-4 w-4 rounded-tr-full border-t-2 border-r-2 border-white/30" />
					<div className="h-4 w-4 rounded-bl-full border-b-2 border-l-2 border-white/30" />
					<div className="h-4 w-4 rounded-br-full border-r-2 border-b-2 border-white/30" />
				</div>
			</div>
		</div>
	);
}
