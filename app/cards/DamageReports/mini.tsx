import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { cn } from "@thorium/utils/cn";
import { useState } from "react";

import { DamageReport } from "./DamageReport";

export function DamageReportsMini() {
	const { shipId } = useStation();
	q.damageReports.stream.useDataStream({ shipId });

	const [selectedEntity, setSelectedEntity] = useState<number | null>(null);
	const [damageReports] = q.damageReports.damageReports.useNetRequest({
		shipId,
	});

	const selectedReport = damageReports.find((d) => d.id === selectedEntity);

	return (
		<div className="grid h-full min-h-72 w-full grid-flow-col grid-cols-4 grid-rows-[auto_2fr_auto_5fr_auto] gap-x-4">
			<div className="damage-reports-list contents">
				<h3 className="text-sm @lg:text-base">Reports</h3>
				<ul className="list-group panel row-span-4 min-h-0 w-full overflow-y-auto">
					{damageReports.map((d) => (
						<li
							key={d.id}
							className={cn("list-group-item text-sm @lg:text-base list-group-item-small", {
								selected: selectedEntity === d.id,
							})}
							onClick={() => setSelectedEntity(d.id)}
						>
							{d.name}
						</li>
					))}
				</ul>
			</div>

			{selectedReport ? <DamageReport {...selectedReport} mini /> : null}
		</div>
	);
}
