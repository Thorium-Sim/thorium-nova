export class ChooseActionEvent extends Event {
	static name = "ChooseActionEvent";
	constructor(public addBlockId: string) {
		super(ChooseActionEvent.name);
	}
}

export class AddActionEvent extends Event {
	static name = "AddActionEvent";
	constructor(
		public addBlockId: string,
		public type: "action" | "event",
		public blockName: string,
		public values: any,
	) {
		super(AddActionEvent.name);
	}
}
