import { ProcessedData } from "@thorium/cards/Legacy/SensorScans/ProcessedData";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { TypingField } from "@thorium/ui/Core";
import { useRef } from "react";

export function SensorsDataCore() {
	const { shipId } = useStation();
	const inputRef = useRef<HTMLTextAreaElement>(null);

	return (
		<div className="flex h-full min-h-0 flex-col text-xs">
			<div className="grid min-h-0 flex-1 grid-cols-4">
				<div className="col-span-3 flex flex-col">
					<TypingField className="h-4 grow-4" ref={inputRef} />
				</div>
				<div className="overflow-y-auto bg-gray-900 p-2">
					<ProcessedData />
				</div>
			</div>
			<div className="flex items-center">
				<Button
					className="btn-xs btn-warning flex-1"
					onClick={() =>
						q.sensors.sendProcessedData.netSend({
							shipId,
							data: inputRef.current?.value || "",
							flash: true,
						})
					}
				>
					F&S
				</Button>
				<Button
					className="btn-xs btn-success flex-1"
					onClick={() =>
						q.sensors.sendProcessedData.netSend({
							shipId,
							data: inputRef.current?.value || "",
						})
					}
				>
					Data
				</Button>
			</div>
		</div>
	);
}
