import { q, clientId } from "@thorium/context/AppContext";
import { SVGImageLoader } from "@thorium/ui/SVGImageLoader";
import { useThoriumAccount } from "@thorium/context/ThoriumAccountContext";
import { CardArea } from "./CardArea";
import { CardSwitcher } from "./CardSwitcher";
import { useManageCard } from "./useManageCard";
import { Widgets } from "./widgets";
import { cn } from "@thorium/utils/cn";
import { useStation } from "@thorium/routes/station/useStation";
import { useRef } from "react";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";

const StationLayout = () => {
	const { client, station, ship } = useStation();
	const [theme] = q.theme.get.useNetRequest({ clientId });
	const [card, changeCard] = useManageCard();

	const { account } = useThoriumAccount();
	if (!ship) return null;
	const alertLevel = ship.alertLevel;
	return (
		<div
			className={`theme-container h-full w-full ${
				station.name === "Viewscreen" ? "viewscreen" : ""
			}`}
		>
			<div
				className={`alertLevel-${alertLevel} h-full`}
				style={
					{
						"--ship-name-width": `${ship.name.length}ch`,
						"--station-name-width": `${station.name.length}ch`,
						"--card-name-width": `${card.name.length}ch`,
						"--login-name-width": `${client.loginName?.length || 0}ch`,
					} as any
				}
			>
				<link rel="stylesheet" href={theme?.assets.processedCSS} />
				<CardSwitcher card={card.name} changeCard={changeCard} />
				<div className="card-frame h-screen">
					<div className="card-frame-inner h-full w-full absolute">
						<div className="card-frame-ship-name select-none">{ship.name}</div>
						{ship.assets?.logo && (
							<div className="card-frame-ship-logo w-24 h-24">
								<SVGImageLoader
									className="card-frame-ship-logo-image"
									url={ship.assets.logo}
								/>
							</div>
						)}
						<div className="card-frame-station-name select-none">
							{station.name}
						</div>
						{station.logo ? (
							<div className="card-frame-station-logo text-white w-24 h-24">
								<SVGImageLoader
									className="card-frame-station-logo-image"
									url={station.logo}
								/>
							</div>
						) : null}
						<div className="card-frame-card-name select-none">{card.name}</div>
						<div className="card-frame-card-icon w-24 h-24">
							<SVGImageLoader
								className="card-frame-card-icon-image"
								url={card.icon || ""}
							/>
						</div>
						<div className="card-frame-login-name select-none">
							{client.loginName}
						</div>
						{account && (
							<div className="card-frame-login-profile w-24 h-24">
								<img
									draggable="false"
									aria-hidden
									className="card-frame-login-profile-image"
									src={account.profilePictureUrl}
									alt={account.displayName}
								/>
							</div>
						)}
						<div className="doodad-1 absolute" />
						<div className="doodad-2 absolute" />
						<div className="doodad-3 absolute" />
						<div className="doodad-4 absolute" />
						<div className="doodad-5 absolute" />
						<div className="doodad-6 absolute" />
						<div className="doodad-7 absolute" />
						<div className="doodad-8 absolute" />
						<div className="doodad-9 absolute" />
						<div className="doodad-10 absolute" />
					</div>
					<div className="card-area relative h-full">
						<CardArea card={card} />
					</div>
					<FlightStatus />
				</div>
				<div className="widgets flex items-center gap-2 absolute bottom-8 right-[calc(2rem+50px)]">
					<Widgets />
				</div>
			</div>
		</div>
	);
};

function FlightStatus() {
	const [flight] = q.flight.active.useNetRequest();
	const { ship } = useStation();

	return (
		<div
			className={cn(
				"absolute z-[500] inset-0 bg-black/50 backdrop-blur transition-all opacity-0 pointer-events-none flex items-center justify-center",
				{
					"opacity-100 pointer-events-auto":
						flight?.state !== "in-progress" || ship.isDestroyed,
				},
			)}
		>
			{flight?.state !== "in-progress" ? (
				<div
					className={cn("panel p-6 text-center", {
						"panel-success": flight?.state === "success",
						"panel-error": flight?.state === "failure",
					})}
				>
					<p className="text-6xl mb-2">
						Mission {flight?.state === "success" ? "Success" : "Failure"}
					</p>
					<p className="text-4xl">{flight?.stateReason}</p>
				</div>
			) : ship.isDestroyed ? (
				<div className="panel p-6 text-center panel-error">
					<p className="text-6xl mb-4">Ship Destroyed</p>
					{ship.isDestroyed?.timeToDestroy !== null ? (
						<p className="text-4xl">
							Respawn in{" "}
							<Countdown
								startTime={ship.isDestroyed.destroyedTimestamp}
								duration={ship.isDestroyed.timeToDestroy}
							/>
						</p>
					) : (
						<p className="text-4xl">Game Over</p>
					)}
				</div>
			) : null}
		</div>
	);
}

function Countdown({
	startTime,
	duration,
}: { startTime: number; duration: number }) {
	const ref = useRef<HTMLSpanElement>(null);

	useAnimationFrame(() => {
		if (ref.current) {
			ref.current.textContent = Math.max(
				0,
				(duration - (Date.now() - startTime)) / 1000,
			).toFixed(1);
		}
	});
	return (
		<span ref={ref} className="tabular-nums">
			{((duration - (Date.now() - startTime)) / 1000).toFixed(1)}
		</span>
	);
}

export default StationLayout;
