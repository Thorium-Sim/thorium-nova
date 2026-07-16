export type ElementProps = {
	elementId: number;
	value: number;
	update: (value: number) => Promise<boolean>;
};
