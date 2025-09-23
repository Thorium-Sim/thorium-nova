import { createContext, type ReactNode, useContext, useMemo } from "react";

const CardContext = createContext({
	cardName: "allData",
	cardLoaded: false,
	isWidget: false,
});

export default function CardProvider({
	children,
	cardLoaded,
	cardName,
	isWidget,
}: {
	cardName: string;
	cardLoaded: boolean;
	children: ReactNode;
	isWidget: boolean;
}) {
	const value = useMemo(
		() => ({ cardName, cardLoaded, isWidget }),
		[cardName, cardLoaded, isWidget],
	);
	return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

export function useCardContext() {
	return useContext(CardContext);
}
