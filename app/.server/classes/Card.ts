interface BaseCard {
	name: string;
	icon?: string | null;
}

export type Card = BaseCard &
	({ component: "EngineeringPanels"; config: { elements: number } } | { component: string });

export type Widget = Card & {
	size?: "sm" | "md" | "lg" | "xl";
	resize?: boolean;
};
