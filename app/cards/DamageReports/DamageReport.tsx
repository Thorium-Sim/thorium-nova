import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";

export function DamageReport({
	id,
	name,
	stepCount,
	currentStepIndex,
	currentStepText,
	mini,
}: {
	id: number;
	name: string;
	stepCount: number;
	currentStepIndex: number;
	currentStepText: string;
	mini?: boolean;
}) {
	return (
		<div className="damage-report-body col-span-3 row-span-5 flex flex-col gap-2 text-base @lg:text-xl">
			<div>{name}</div>
			<div className="panel flex-1 overflow-y-auto p-4 text-base whitespace-pre-wrap @lg:text-2xl">
				{currentStepText}
			</div>
			<div className="flex items-center justify-between gap-2">
				<div>
					Step {currentStepIndex + 1} / {stepCount}
				</div>
				{!mini && (
					<Button
						className="btn-error damage-report-abort"
						onClick={() => q.damageReports.abortDamageReport.netSend({ reportId: id })}
					>
						Abort Report
					</Button>
				)}
			</div>
		</div>
	);
}
