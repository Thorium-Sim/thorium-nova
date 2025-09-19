import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { OutputField, TypingField } from "@thorium/ui/Core";
import Select from "@thorium/ui/Select";

export function LegacySensorScansCore() {
	return (
		<div className="flex flex-col h-full text-xs">
			<div className="flex justify-between">
				<div>
					<Button className="btn-xs btn-active">External</Button>
					<Button className="btn-xs">Internal</Button>
				</div>
				<Checkbox label="Scan History" labelProps={{ className: "text-xs" }} />
				<Button className="btn-xs btn-warning">Processed Data History</Button>
			</div>
			<div className="flex flex-1">
				<div className="flex-grow bg-gray-900"></div>
				<div className="flex flex-col flex-grow-[2]">
					<OutputField className="flex-grow-[2] h-4">
						Soup Or something
					</OutputField>
					<TypingField className="flex-grow-[4] h-4" />
				</div>
			</div>
			<div className="flex items-center">
				<Button className="btn-xs btn-primary flex-1">Send</Button>
				<Select
					items={[]}
					size="xxs"
					label="Answers"
					placeholder="Answers"
					labelHidden
					selected={null}
					setSelected={() => {}}
				/>
				<Select
					items={[]}
					size="xxs"
					label="Info"
					placeholder="Info"
					labelHidden
					selected={null}
					setSelected={() => {}}
				/>
				<Button className="btn-xs btn-warning flex-1">F&S</Button>
				<Button className="btn-xs btn-success flex-1">Data</Button>
			</div>
			<div className="flex items-center">
				<Button className="btn-xs flex-1">Probe Data</Button>
				<Button className="btn-xs btn-warning flex-1">F&S</Button>
			</div>
		</div>
	);
}
