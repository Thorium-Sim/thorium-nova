import Select from "@thorium/ui/Select";

export function LongRangeComm() {
	return (
		<div>
			<Select
				label="Sup"
				items={[
					{ label: "What", id: "what" },
					{ label: "Yeah", id: "yeah" },
				]}
				selected={null}
				setSelected={() => {}}
			></Select>
		</div>
	);
}
