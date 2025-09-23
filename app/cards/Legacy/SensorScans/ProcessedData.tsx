import { TimeCounter } from "@thorium/components/TimeCounter";
import { TypingText } from "@thorium/components/TypingText";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { Icon } from "@thorium/ui/Icon";
import { Fragment, type DetailedHTMLProps, type HTMLAttributes } from "react";

export function ProcessedData(
	props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
) {
	const { shipId, station } = useStation();
	const isCore = station.name === "Flight Director";
	const [sensors] = q.legacy.sensorScans.sensors.useNetRequest({ shipId });
	return (
		<div {...props}>
			{sensors.processedData.map(({ data, timestamp }, i, arr) => (
				<Fragment key={timestamp}>
					<pre className="whitespace-pre-wrap">
						{isCore ? data : <TypingText>{data}</TypingText>}
						{isCore ? (
							<button
								onClick={() =>
									q.legacy.sensorScans.removeProcessedData.netSend({
										shipId,
										timestamp,
									})
								}
							>
								<Icon name="ban" className="text-red-500" />
							</button>
						) : null}
						<div>
							<small>
								<TimeCounter time={new Date(timestamp)} />
							</small>
						</div>
					</pre>
					{i < arr.length - 1 && <hr className="my-4 border-white/20" />}
				</Fragment>
			))}
		</div>
	);
}
