export interface ContactProperties {
	id: number;
	name: string;
	type: "contact" | "border" | "planet" | "ping" | "projectile";
	icon: string;
	picture: string | null;
	color: string;
	size: number;
	locked: boolean;
	disabled: boolean;
	hostile: boolean;
	cloaked: boolean;
	infrared: boolean;
	destroyed: boolean;
	position: { x: number; y: number };
	destination: { x: number; y: number };
}
