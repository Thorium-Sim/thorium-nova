import type { stationSchema } from "@thorium/ecs-components/stationComplementSchema";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { z } from "zod";

const CardContext = createContext<
	{
		cardLoaded: boolean;
		isWidget: boolean;
	} & Card
>({
	name: "allData",
	component: "unknown",
	cardLoaded: false,
	isWidget: false,
});

export type Card = z.infer<typeof stationSchema>["cards"][number];

export default function CardProvider({
	children,
	cardLoaded,
	isWidget,
	...rest
}: {
	children: ReactNode;
	cardLoaded: boolean;
	isWidget: boolean;
} & Card) {
	const value = useMemo(() => ({ cardLoaded, isWidget, ...rest }), [cardLoaded, isWidget, rest]);
	return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

export function useCardContext() {
	return useContext(CardContext);
}
