import type { BlockProps } from "@thorium/components/timelineBuilder/BlockInputs";
import Input from "@thorium/ui/Input";

export function NoteBlock({ update, note }: BlockProps<"Note">) {
	return (
		<Input
			rows={5}
			className="w-[40rem] max-w-full"
			as="textarea"
			defaultValue={note}
			label="Note"
			onBlur={(event) => update("note", event.target.value)}
		/>
	);
}
